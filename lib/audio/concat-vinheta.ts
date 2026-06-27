import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import ffmpegPath from 'ffmpeg-static'
import { getStorage } from '@/lib/storage'

const execFileAsync = promisify(execFile)

// ============================================================
// Cola a vinheta no final do áudio da faixa, gerando um MP3
// novo — usado só pro arquivo entregue no download (no player,
// a vinheta é só enfileirada dinamicamente, sem tocar aqui).
//
// Processado sob demanda (lazy) no primeiro download após a
// faixa ser publicada ou após a vinheta de download trocar —
// o resultado fica cacheado em `track.downloadAudioKey`, então
// isso só roda uma vez por combinação faixa+vinheta, não a cada
// clique em "baixar".
// ============================================================

export async function bakeVinhetaIntoTrack(params: {
  trackId: string
  audioKey: string
  vinhetaKey: string
}): Promise<string> {
  if (!ffmpegPath) {
    throw new Error('Binário do ffmpeg não encontrado (ffmpeg-static)')
  }

  const storage = getStorage()

  const [trackSigned, vinhetaSigned] = await Promise.all([
    storage.getSignedDownloadUrl(params.audioKey, 300, 'private'),
    storage.getSignedDownloadUrl(params.vinhetaKey, 300, 'private'),
  ])

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vinheta-'))
  const trackPath = path.join(tmpDir, 'track.input')
  const vinhetaPath = path.join(tmpDir, 'vinheta.input')
  const outPath = path.join(tmpDir, 'out.mp3')

  try {
    await Promise.all([
      downloadToFile(trackSigned.downloadUrl, trackPath),
      downloadToFile(vinhetaSigned.downloadUrl, vinhetaPath),
    ])

    // Re-codifica os dois pra MP3 e concatena — funciona independente do
    // formato de origem (mp3/wav/flac/aiff) da faixa e da vinheta.
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', trackPath,
      '-i', vinhetaPath,
      '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[out]',
      '-map', '[out]',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outPath,
    ])

    const body = await fs.readFile(outPath)
    const key = `audio-with-vinheta/${params.trackId}-${crypto.randomUUID()}.mp3`

    const { uploadUrl } = await storage.getSignedUploadUrl(
      key,
      { contentType: 'audio/mpeg' },
      'private'
    )

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/mpeg' },
      body,
    })
    if (!putRes.ok) {
      throw new Error(`Falha ao subir áudio com vinheta: HTTP ${putRes.status}`)
    }

    return key
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao baixar arquivo de origem: HTTP ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(destPath, buffer)
}
