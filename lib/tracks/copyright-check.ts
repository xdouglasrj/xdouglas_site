import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'
import type { Prisma } from '@prisma/client'

const execFileAsync = promisify(execFile)

// ============================================================
// V3 Plano 20 — Verificação de copyright no upload (AcoustID)
//
// Camada GRATUITA de proteção: fingerprint acústico (Chromaprint/fpcalc)
// + consulta ao banco MusicBrainz via API pública do AcoustID. Resultado
// é sempre um AVISO para o moderador — NUNCA bloqueia upload/publicação.
//
// Limitação de infra conhecida: o binário `fpcalc` (Chromaprint) não é
// distribuído como binário estático via npm (diferente do `ffmpeg-static`
// já usado no projeto). Se o binário não existir no ambiente (dev local
// sem instalação, ou runtime da Vercel sem o binário), a verificação
// degrada para "skipped" silenciosamente — nunca lança erro, nunca
// atrasa/bloqueia o fluxo de upload. Ver relatório do agente para a
// decisão de infra necessária (instalar fpcalc no build, ou aceitar
// "skipped" permanente).
// ============================================================

const ACOUSTID_LOOKUP_URL = 'https://api.acoustid.org/v2/lookup'
const TOTAL_TIMEOUT_MS = 15_000
// Chromaprint usa por padrão ~120s de áudio para o fingerprint — não
// precisamos baixar o arquivo inteiro (sets podem ter 1h+)
const MAX_AUDIO_BYTES_TO_FETCH = 8 * 1024 * 1024 // ~8MB cobre bem 120s até em FLAC
const MATCH_SCORE_THRESHOLD = 0.85

export type CopyrightStatus = 'pending' | 'clear' | 'match' | 'error' | 'skipped'

export interface CopyrightMatchResult {
  score: number
  recordingId: string
  title: string
  artist: string
}

interface AcoustidRecording {
  id?: string
  title?: string
  artists?: { name: string }[]
}

interface AcoustidResult {
  score: number
  recordings?: AcoustidRecording[]
}

interface AcoustidResponse {
  status: string
  results?: AcoustidResult[]
}

// ============================================================
// Roda a verificação para uma faixa. NUNCA lança para o chamador —
// qualquer falha (sem key, sem fpcalc, timeout, API fora) é capturada
// e resulta em "error" ou "skipped" persistido no banco.
// ============================================================
export async function runCopyrightCheck(trackId: string): Promise<void> {
  try {
    const apiKey = process.env.ACOUSTID_API_KEY

    if (!apiKey) {
      // Sem key configurada — feature inerte, nada a fazer. Site funciona
      // exatamente igual ao de hoje.
      await setCopyrightStatus(trackId, 'skipped')
      return
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { audioKey: true },
    })
    if (!track) return // faixa pode ter sido removida entre o upload e o check

    const result = await withTimeout(
      checkTrackAgainstAcoustid(track.audioKey, apiKey),
      TOTAL_TIMEOUT_MS
    )

    if (result === 'skipped') {
      await setCopyrightStatus(trackId, 'skipped')
      return
    }

    if (result) {
      await setCopyrightStatus(trackId, 'match', result)
    } else {
      await setCopyrightStatus(trackId, 'clear')
    }
  } catch (err) {
    console.error('[copyright-check] Falha ao verificar faixa', trackId, err)
    await setCopyrightStatus(trackId, 'error').catch((dbErr) =>
      console.error('[copyright-check] Falha ao gravar status de erro', trackId, dbErr)
    )
  }
}

async function setCopyrightStatus(
  trackId: string,
  status: CopyrightStatus,
  result?: CopyrightMatchResult
): Promise<void> {
  const resultJson: Prisma.InputJsonValue | undefined = result
    ? { score: result.score, recordingId: result.recordingId, title: result.title, artist: result.artist }
    : undefined

  await prisma.track.update({
    where: { id: trackId },
    data: {
      copyrightStatus: status,
      copyrightResult: resultJson,
      copyrightAt: new Date(),
    },
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de ${ms}ms na verificação de copyright`)), ms)
    ),
  ])
}

// Retorna: CopyrightMatchResult (match), null (sem match / clear), ou
// "skipped" (fpcalc indisponível no ambiente)
async function checkTrackAgainstAcoustid(
  audioKey: string,
  apiKey: string
): Promise<CopyrightMatchResult | null | 'skipped'> {
  const fpcalcAvailable = await isFpcalcAvailable()
  if (!fpcalcAvailable) return 'skipped'

  const storage = getStorage()
  const { downloadUrl } = await storage.getSignedDownloadUrl(audioKey, 120, 'private')

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acoustid-'))
  const audioPath = path.join(tmpDir, `input-${crypto.randomUUID()}`)

  try {
    await downloadPartialAudio(downloadUrl, audioPath)

    const { stdout } = await execFileAsync('fpcalc', ['-json', audioPath], {
      timeout: TOTAL_TIMEOUT_MS,
    })
    const parsed = JSON.parse(stdout) as { duration?: number; fingerprint?: string }
    if (!parsed.fingerprint || !parsed.duration) {
      throw new Error('fpcalc não retornou fingerprint/duration válidos')
    }

    return await lookupAcoustid(apiKey, parsed.duration, parsed.fingerprint)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// Verifica se o binário `fpcalc` (Chromaprint) existe no PATH do runtime
// atual. Cacheado em memória do processo — evita spawnar um processo
// extra a cada verificação quando já sabemos que está ausente.
let fpcalcAvailableCache: boolean | null = null

async function isFpcalcAvailable(): Promise<boolean> {
  if (fpcalcAvailableCache !== null) return fpcalcAvailableCache

  try {
    await execFileAsync('fpcalc', ['-version'], { timeout: 5_000 })
    fpcalcAvailableCache = true
  } catch {
    fpcalcAvailableCache = false
  }
  return fpcalcAvailableCache
}

// Baixa só os primeiros MAX_AUDIO_BYTES_TO_FETCH bytes via Range request —
// suficiente para os ~120s de áudio que o fpcalc usa por padrão, sem puxar
// o arquivo inteiro de um set/podcast longo
async function downloadPartialAudio(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, {
    headers: { Range: `bytes=0-${MAX_AUDIO_BYTES_TO_FETCH - 1}` },
  })
  if (!res.ok && res.status !== 206) {
    throw new Error(`Falha ao baixar áudio para fingerprint: HTTP ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(destPath, buffer)
}

async function lookupAcoustid(
  apiKey: string,
  duration: number,
  fingerprint: string
): Promise<CopyrightMatchResult | null> {
  const params = new URLSearchParams({
    client: apiKey,
    meta: 'recordings',
    duration: String(Math.round(duration)),
    fingerprint,
  })

  const res = await fetch(`${ACOUSTID_LOOKUP_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`AcoustID API respondeu HTTP ${res.status}`)
  }

  const data = (await res.json()) as AcoustidResponse
  if (data.status !== 'ok') {
    throw new Error(`AcoustID API retornou status "${data.status}"`)
  }

  const results = data.results ?? []
  const best = results
    .filter((r) => r.recordings && r.recordings.length > 0)
    .sort((a, b) => b.score - a.score)[0]

  if (!best || best.score < MATCH_SCORE_THRESHOLD) return null

  const recording = best.recordings![0]
  return {
    score: Math.round(best.score * 100) / 100,
    recordingId: recording.id ?? 'desconhecido',
    title: recording.title ?? 'Título desconhecido',
    artist: recording.artists?.map((a) => a.name).join(', ') ?? 'Artista desconhecido',
  }
}
