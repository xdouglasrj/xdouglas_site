'use client'

import { guess } from 'web-audio-beat-detector'

/**
 * Decodifica o arquivo de áudio no navegador e estima o BPM.
 * Roda inteiramente no client (Web Audio API) — não envia o arquivo a lugar nenhum.
 * Retorna null se a detecção falhar (formato não suportado, áudio sem batida clara, etc).
 */
export async function detectBpm(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioContextClass()

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const { bpm } = await guess(audioBuffer)
      return Math.round(bpm)
    } finally {
      await audioContext.close()
    }
  } catch {
    return null
  }
}
