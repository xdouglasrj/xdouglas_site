'use client'

/**
 * Extrai a duração (em segundos) do arquivo de áudio no navegador,
 * via elemento <audio> + object URL — mais barato que decodificar o
 * buffer inteiro. Retorna null se o formato não for suportado.
 * (V3 Plano 5 — duração preenchida automaticamente no upload)
 */
export function detectDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    function cleanup() {
      URL.revokeObjectURL(url)
      audio.removeAttribute('src')
    }

    audio.addEventListener('loadedmetadata', () => {
      const duration = isFinite(audio.duration) ? Math.round(audio.duration) : null
      cleanup()
      resolve(duration && duration > 0 ? duration : null)
    })
    audio.addEventListener('error', () => {
      cleanup()
      resolve(null)
    })

    audio.src = url
  })
}
