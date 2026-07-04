'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAnalytics } from '@/components/analytics/use-analytics'
import {
  getLocalResumePosition,
  setLocalResumePosition,
  clearLocalResumePosition,
} from './resume-storage'

// ============================================================
// Retomar de onde parou (V3 Plano 11) — constantes espelhando
// lib/social/playback-progress.ts (mantidas em sincronia manualmente
// porque um arquivo é client-safe e o outro importa o Prisma client).
// ============================================================
const MIN_DURATION_FOR_RESUME_SECONDS = 10 * 60
const COMPLETE_THRESHOLD_RATIO = 0.95
const RESUME_MIN_RATIO = 0.05
const SAVE_PROGRESS_INTERVAL_MS = 15_000

// V3 Plano 17 — histórico de escuta: registra só após ~10s tocando (evita
// poluir com cliques). Espelha MIN_LISTEN_SECONDS_TO_RECORD em
// lib/social/listening-history.ts (client-safe, sem import do Prisma).
const MIN_LISTEN_SECONDS_TO_RECORD = 10

// ============================================================
// PlayerProvider — estado global de reprodução (V3 Plano 1)
//
// Um ÚNICO elemento <audio> vive aqui. Todos os pontos de play
// do site (cards, página da faixa, playlists, perfil) chamam
// playTrack() deste contexto — nunca criam áudio próprio.
// A vinheta continua encadeada dinamicamente após cada faixa
// (arquivo separado, nunca concatenado no áudio original).
// ============================================================

export interface PlayerTrack {
  id: string
  slug: string
  title: string
  artistName: string
  coverUrl: string | null
}

export type RepeatMode = 'off' | 'all' | 'one'

/** Toast discreto "Retomando de 42:10 — recomeçar" (V3 Plano 11) */
export interface ResumeToast {
  trackId: string
  positionSeconds: number
}

interface PlayerContextValue {
  /** Faixa atual (null = player nunca usado nesta sessão) */
  currentTrack: PlayerTrack | null
  queue: PlayerTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  /** Tocando a vinheta entre faixas (seek desabilitado) */
  isVinheta: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  /** Não-nulo logo após retomar uma faixa — some ao chamar dismissResumeToast() */
  resumeToast: ResumeToast | null
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  /** Pula direto para um índice da fila */
  playIndex: (index: number) => void
  /** Fecha o toast de retomada (chamado ao clicar "recomeçar" ou fechar) */
  dismissResumeToast: () => void
  /** "Recomeçar do zero" — volta pro início e fecha o toast */
  restartFromBeginning: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer deve ser usado dentro de <PlayerProvider>')
  return ctx
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<PlayerTrack[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVinheta, setIsVinheta] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [resumeToast, setResumeToast] = useState<ResumeToast | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Refs que os listeners do <audio> leem sem re-registrar handlers
  const queueRef = useRef<PlayerTrack[]>([])
  const indexRef = useRef(0)
  const shuffleRef = useRef(false)
  const repeatRef = useRef<RepeatMode>('off')
  const vinhetaRef = useRef(false)
  // Progresso de contagem de play da faixa atual (mesma semântica
  // do waveform-player antigo: cada evento dispara UMA vez)
  const playStartFiredRef = useRef(false)
  const played30sRef = useRef(false)
  const completedRef = useRef(false)
  // V3 Plano 17 — dispara UMA vez por faixa carregada, só para logados
  const listenRecordedRef = useRef(false)
  // Evita que uma troca de faixa antiga sobrescreva a mais recente
  const loadSeqRef = useRef(0)

  // ── Retomar de onde parou (V3 Plano 11) ─────────────────────
  // null = ainda não sabemos; true/false decidido na 1ª tentativa de API
  const isLoggedInRef = useRef<boolean | null>(null)
  const lastSaveAtRef = useRef(0)
  const progressCompletedRef = useRef(false)

  const { trackPlayStart, trackPlay30s, trackPlayComplete } = useAnalytics()
  const analyticsRef = useRef({ trackPlayStart, trackPlay30s, trackPlayComplete })
  analyticsRef.current = { trackPlayStart, trackPlay30s, trackPlayComplete }

  queueRef.current = queue
  indexRef.current = queueIndex
  shuffleRef.current = shuffle
  repeatRef.current = repeat
  vinhetaRef.current = isVinheta

  const currentTrack = queue[queueIndex] ?? null
  const currentTrackRef = useRef<PlayerTrack | null>(null)
  currentTrackRef.current = currentTrack

  // ── Retomar de onde parou: leitura/gravação (V3 Plano 11) ───
  // Anônimo nunca chama a API — só localStorage. Logado tenta a API; se
  // vier 401 (sessão anônima/expirada), cai para localStorage pelo resto
  // da sessão sem tentar de novo (isLoggedInRef memoiza o resultado).
  async function fetchSavedProgress(trackId: string): Promise<number | null> {
    if (isLoggedInRef.current === false) {
      return getLocalResumePosition(trackId)
    }
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/progress`)
      if (res.status === 401) {
        isLoggedInRef.current = false
        return getLocalResumePosition(trackId)
      }
      if (!res.ok) return null
      isLoggedInRef.current = true
      const data = await res.json()
      return typeof data.positionSeconds === 'number' ? data.positionSeconds : null
    } catch {
      return getLocalResumePosition(trackId)
    }
  }

  function persistProgress(trackId: string, positionSeconds: number, durationSeconds: number) {
    if (isLoggedInRef.current === false) {
      setLocalResumePosition(trackId, positionSeconds)
      return
    }
    fetch(`/api/social/tracks/${trackId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionSeconds }),
    })
      .then((res) => {
        if (res.status === 401) {
          isLoggedInRef.current = false
          setLocalResumePosition(trackId, positionSeconds)
          return
        }
        isLoggedInRef.current = true
        if (positionSeconds / durationSeconds >= COMPLETE_THRESHOLD_RATIO) {
          clearLocalResumePosition(trackId)
        }
      })
      .catch(() => {
        // Falha de rede — best effort, próximo tick de 15s tenta de novo
      })
  }

  /** Chamado após loadedmetadata: decide se retoma e mostra o toast. */
  async function maybeResume(audio: HTMLAudioElement) {
    const track = currentTrackRef.current
    if (!track) return
    const seq = loadSeqRef.current

    const dur = audio.duration
    if (!isFinite(dur) || dur < MIN_DURATION_FOR_RESUME_SECONDS) return

    const saved = await fetchSavedProgress(track.id)
    if (seq !== loadSeqRef.current) return // faixa trocada enquanto buscava
    if (saved === null) return

    const ratio = saved / dur
    if (ratio < RESUME_MIN_RATIO || ratio >= COMPLETE_THRESHOLD_RATIO) return

    audio.currentTime = saved
    setCurrentTime(saved)
    setResumeToast({ trackId: track.id, positionSeconds: saved })
  }

  const dismissResumeToast = useCallback(() => setResumeToast(null), [])

  const restartFromBeginning = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = 0
      setCurrentTime(0)
    }
    setResumeToast(null)
  }, [])

  // ── Elemento <audio> único ──────────────────────────────────
  function ensureAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current
    const audio = new Audio()
    audio.preload = 'auto'

    audio.addEventListener('loadedmetadata', () => {
      if (vinhetaRef.current) return
      setDuration(audio.duration)
      void maybeResume(audio)
    })
    audio.addEventListener('timeupdate', () => {
      if (vinhetaRef.current) return
      setCurrentTime(audio.currentTime)
      const track = currentTrackRef.current
      if (track && !played30sRef.current && audio.currentTime >= 30) {
        played30sRef.current = true
        analyticsRef.current.trackPlay30s(track.id, audio.duration)
      }
      // Histórico de escuta (V3 Plano 17) — registra 1x por faixa, só
      // após ~10s tocando, só para usuários logados (anônimo nunca chama).
      if (
        track &&
        !listenRecordedRef.current &&
        audio.currentTime >= MIN_LISTEN_SECONDS_TO_RECORD &&
        isLoggedInRef.current !== false
      ) {
        listenRecordedRef.current = true
        recordListen(track.id)
      }
      // Salva progresso a cada ~15s tocando (V3 Plano 11) — não salva
      // durante a vinheta nem antes de a duração estar disponível.
      if (
        track &&
        !progressCompletedRef.current &&
        isFinite(audio.duration) &&
        audio.duration >= MIN_DURATION_FOR_RESUME_SECONDS
      ) {
        const now = Date.now()
        if (now - lastSaveAtRef.current >= SAVE_PROGRESS_INTERVAL_MS) {
          lastSaveAtRef.current = now
          persistProgress(track.id, audio.currentTime, audio.duration)
        }
      }
    })
    audio.addEventListener('play', () => {
      setIsPlaying(true)
      const track = currentTrackRef.current
      if (track && !vinhetaRef.current && !playStartFiredRef.current) {
        playStartFiredRef.current = true
        analyticsRef.current.trackPlayStart(track.id)
      }
    })
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => {
      void handleEnded(audio)
    })

    audioRef.current = audio
    return audio
  }

  // ── Fim de faixa: complete → vinheta → próxima ─────────────
  async function handleEnded(audio: HTMLAudioElement) {
    if (vinhetaRef.current) {
      setIsVinheta(false)
      advance()
      return
    }

    const track = currentTrackRef.current
    if (track && !completedRef.current) {
      completedRef.current = true
      analyticsRef.current.trackPlayComplete(track.id, audio.duration)
    }

    // Faixa concluída (>95%, ou aqui 100%) — apaga o progresso salvo
    // (V3 Plano 11: faixa "vista" não retoma mais).
    if (track && !progressCompletedRef.current) {
      progressCompletedRef.current = true
      clearLocalResumePosition(track.id)
      if (isLoggedInRef.current !== false && isFinite(audio.duration) && audio.duration > 0) {
        persistProgress(track.id, audio.duration, audio.duration)
      }
    }

    // Repeat one: recomeça a mesma faixa sem vinheta
    if (repeatRef.current === 'one') {
      audio.currentTime = 0
      resetPlayCounters()
      void audio.play().catch(() => setIsPlaying(false))
      return
    }

    const played = await tryPlayVinheta(audio)
    if (!played) advance()
  }

  async function tryPlayVinheta(audio: HTMLAudioElement): Promise<boolean> {
    // Se o usuário trocar de faixa enquanto o fetch da vinheta está em voo,
    // loadAndPlay incrementa loadSeqRef — a vinheta atrasada não pode
    // sobrescrever o src da faixa recém-escolhida.
    const seq = loadSeqRef.current
    try {
      const res = await fetch('/api/vinheta')
      if (seq !== loadSeqRef.current) return true // troca manual venceu — não avançar
      if (!res.ok) return false
      const data = await res.json()
      if (seq !== loadSeqRef.current) return true
      if (!data.streamUrl) return false

      setIsVinheta(true)
      vinhetaRef.current = true
      audio.src = data.streamUrl
      await audio.play()
      return true
    } catch {
      if (seq !== loadSeqRef.current) return true
      setIsVinheta(false)
      vinhetaRef.current = false
      return false
    }
  }

  function resetPlayCounters() {
    playStartFiredRef.current = false
    played30sRef.current = false
    completedRef.current = false
    listenRecordedRef.current = false
  }

  // V3 Plano 17 — registra a escuta no histórico (best-effort, fire-and-forget).
  // Se vier 401 (sessão anônima), marca como não-logado pelo resto da sessão
  // (mesma memoização de isLoggedInRef usada no progresso do Plano 11).
  function recordListen(trackId: string) {
    fetch(`/api/social/tracks/${trackId}/listen`, { method: 'POST' })
      .then((res) => {
        if (res.status === 401) {
          isLoggedInRef.current = false
          return
        }
        isLoggedInRef.current = true
      })
      .catch(() => {
        // Falha de rede — best effort, não repete no meio da mesma faixa
      })
  }

  // ── Carregar e tocar uma faixa da fila ──────────────────────
  const loadAndPlay = useCallback(async (index: number) => {
    const track = queueRef.current[index]
    if (!track) return

    const seq = ++loadSeqRef.current
    const audio = ensureAudio()
    audio.pause()
    setIsVinheta(false)
    vinhetaRef.current = false
    setQueueIndex(index)
    indexRef.current = index
    setCurrentTime(0)
    setDuration(0)
    resetPlayCounters()
    setIsLoading(true)
    setResumeToast(null)
    progressCompletedRef.current = false
    lastSaveAtRef.current = 0

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      })
      const data = await res.json()
      // Outra faixa foi pedida enquanto esta carregava — descarta
      if (seq !== loadSeqRef.current) return
      if (!res.ok || !data.streamUrl) {
        setIsLoading(false)
        return
      }

      audio.src = data.streamUrl
      await audio.play()
      if (seq !== loadSeqRef.current) return
      setIsLoading(false)
    } catch {
      if (seq === loadSeqRef.current) setIsLoading(false)
    }
  }, [])

  // Próxima faixa respeitando shuffle/repeat
  function advance() {
    const list = queueRef.current
    const idx = indexRef.current
    if (list.length === 0) return

    let nextIndex: number
    if (shuffleRef.current && list.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * list.length)
      } while (nextIndex === idx)
    } else {
      nextIndex = idx + 1
    }

    if (nextIndex >= list.length) {
      if (repeatRef.current === 'all') nextIndex = 0
      else {
        // Fim da fila — para, mas mantém a barra com a última faixa
        setIsPlaying(false)
        setCurrentTime(0)
        return
      }
    }
    void loadAndPlay(nextIndex)
  }

  // ── API pública ─────────────────────────────────────────────
  const playTrack = useCallback(
    (track: PlayerTrack, newQueue?: PlayerTrack[]) => {
      const current = currentTrackRef.current
      // Clicar na faixa que já está carregada = play/pause
      if (current?.id === track.id && audioRef.current?.src && !vinhetaRef.current) {
        const audio = audioRef.current
        if (audio.paused) void audio.play().catch(() => setIsPlaying(false))
        else audio.pause()
        return
      }

      const list = newQueue && newQueue.length > 0 ? newQueue : [track]
      const index = Math.max(0, list.findIndex((t) => t.id === track.id))
      setQueue(list)
      queueRef.current = list
      void loadAndPlay(index)
    },
    [loadAndPlay],
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (audio.paused) void audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [])

  const next = useCallback(() => {
    if (queueRef.current.length === 0) return
    advance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prev = useCallback(() => {
    const audio = audioRef.current
    // Comportamento padrão de players: >3s volta pro início da faixa
    if (audio && !vinhetaRef.current && audio.currentTime > 3) {
      audio.currentTime = 0
      setCurrentTime(0)
      return
    }
    const prevIndex = indexRef.current - 1
    if (prevIndex >= 0) void loadAndPlay(prevIndex)
    else if (audio && !vinhetaRef.current) {
      audio.currentTime = 0
      setCurrentTime(0)
    }
  }, [loadAndPlay])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio || vinhetaRef.current || !isFinite(audio.duration)) return
    audio.currentTime = Math.min(Math.max(0, seconds), audio.duration)
    setCurrentTime(audio.currentTime)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeState(clamped)
    if (audioRef.current) audioRef.current.volume = clamped
  }, [])

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), [])

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
  }, [])

  const playIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= queueRef.current.length) return
      void loadAndPlay(index)
    },
    [loadAndPlay],
  )

  // ── Salvar progresso ao esconder/fechar a aba (V3 Plano 11) ──
  // Complementa o save periódico de 15s do timeupdate — cobre o caso de
  // fechar o navegador antes do próximo tick.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== 'hidden') return
      const audio = audioRef.current
      const track = currentTrackRef.current
      if (!audio || !track || vinhetaRef.current || progressCompletedRef.current) return
      if (!isFinite(audio.duration) || audio.duration < MIN_DURATION_FOR_RESUME_SECONDS) return
      persistProgress(track.id, audio.currentTime, audio.duration)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Media Session API (tela de bloqueio do celular) ─────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    if (!currentTrack) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: isVinheta ? 'Vinheta' : currentTrack.title,
      artist: isVinheta ? 'xDouglas' : currentTrack.artistName,
      artwork: currentTrack.coverUrl
        ? [{ src: currentTrack.coverUrl, sizes: '512x512' }]
        : [],
    })
  }, [currentTrack, isVinheta])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => toggle())
    ms.setActionHandler('pause', () => toggle())
    ms.setActionHandler('nexttrack', () => next())
    ms.setActionHandler('previoustrack', () => prev())
    try {
      ms.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) seek(details.seekTime)
      })
    } catch {
      // seekto não suportado em alguns navegadores — ignora
    }
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
      ms.setActionHandler('nexttrack', null)
      ms.setActionHandler('previoustrack', null)
      try {
        ms.setActionHandler('seekto', null)
      } catch {
        // idem
      }
    }
  }, [toggle, next, prev, seek])

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isLoading,
      isVinheta,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      resumeToast,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      playIndex,
      dismissResumeToast,
      restartFromBeginning,
    }),
    [
      currentTrack, queue, queueIndex, isPlaying, isLoading, isVinheta,
      currentTime, duration, volume, shuffle, repeat, resumeToast,
      playTrack, toggle, next, prev, seek, setVolume, toggleShuffle,
      cycleRepeat, playIndex, dismissResumeToast, restartFromBeginning,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
