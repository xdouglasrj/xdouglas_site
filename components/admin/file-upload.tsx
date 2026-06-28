'use client'

import { useState, useRef } from 'react'
import { clsx } from 'clsx'
import { detectBpm } from '@/lib/audio/detect-bpm'

// ============================================================
// Tipos
// ============================================================

interface UploadResult {
  storageKey: string
  publicUrl?: string
  sizeBytes: number
}

interface FileUploadProps {
  kind: 'audio' | 'cover' | 'avatar'
  accept: string
  label: string
  hint?: string
  currentKey?: string
  currentUrl?: string
  onUpload: (result: UploadResult) => void
  onError?: (message: string) => void
  onBpmDetected?: (bpm: number) => void
  disabled?: boolean
  uploadUrlEndpoint?: string
}

// ============================================================
// Componente
// ============================================================

export function FileUpload({
  kind,
  accept,
  label,
  hint,
  currentKey,
  currentUrl,
  onUpload,
  onError,
  onBpmDetected,
  disabled,
  uploadUrlEndpoint = '/api/admin/musicas/upload-url',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [filename, setFilename] = useState<string | null>(null)
  const [detectingBpm, setDetectingBpm] = useState(false)

  // Já tem arquivo — mostra o atual
  const hasExisting = !!currentKey && state === 'idle'

  async function handleFile(file: File) {
    if (disabled) return

    setFilename(file.name)
    setState('uploading')
    setProgress(0)

    if (kind === 'audio' && onBpmDetected) {
      setDetectingBpm(true)
      detectBpm(file)
        .then((bpm) => { if (bpm) onBpmDetected(bpm) })
        .finally(() => setDetectingBpm(false))
    }

    try {
      // 1. Solicita presigned URL ao backend
      const res = await fetch(uploadUrlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          kind,
          sizeBytes: file.size,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao gerar URL de upload')
      }

      const { uploadUrl, storageKey, publicUrl } = await res.json()

      // 2. PUT direto para o R2 com acompanhamento de progresso via XHR
      await uploadWithProgress(uploadUrl, file, (pct) => setProgress(pct))

      setState('done')
      onUpload({ storageKey, publicUrl, sizeBytes: file.size })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro no upload'
      setState('error')
      onError?.(message)
      // Volta ao idle após 3s
      setTimeout(() => setState('idle'), 3000)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-300">{label}</label>

      <div
        onClick={() => state === 'idle' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={clsx(
          'relative rounded-lg border-2 border-dashed transition-colors',
          'flex flex-col items-center justify-center gap-2 p-6 text-center',
          state === 'idle' && !disabled
            ? 'border-neutral-700 hover:border-neutral-500 cursor-pointer'
            : 'border-neutral-800 cursor-default',
          state === 'done' && 'border-emerald-800 bg-emerald-950/20',
          state === 'error' && 'border-red-800 bg-red-950/20',
          disabled && 'opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
          disabled={disabled}
        />

        {state === 'uploading' ? (
          <>
            <div className="w-full max-w-xs h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              Enviando {filename}… {Math.round(progress)}%
            </p>
            {detectingBpm && (
              <p className="text-xs text-neutral-600">Detectando BPM…</p>
            )}
          </>
        ) : state === 'done' ? (
          <>
            <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-emerald-400">
              {filename} enviado com sucesso
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setState('idle') }}
              className="text-xs text-neutral-500 hover:text-neutral-300 underline"
            >
              Trocar arquivo
            </button>
          </>
        ) : state === 'error' ? (
          <p className="text-xs text-red-400">Erro no upload. Clique para tentar novamente.</p>
        ) : hasExisting ? (
          <>
            {(kind === 'cover' || kind === 'avatar') && currentUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUrl}
                alt={kind === 'avatar' ? 'Foto atual' : 'Capa atual'}
                className={kind === 'avatar' ? 'w-16 h-16 object-cover rounded-full' : 'w-16 h-16 object-cover rounded-md'}
              />
            )}
            <p className="text-xs text-neutral-400 break-all">
              {kind === 'cover' ? 'Capa atual' : kind === 'avatar' ? 'Foto atual' : 'Arquivo atual'}: <span className="text-neutral-600">{currentKey.split('/').pop()}</span>
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-rose-500 hover:text-rose-400 underline"
            >
              Trocar {kind === 'audio' ? 'arquivo' : kind === 'avatar' ? 'foto' : 'capa'}
            </button>
          </>
        ) : (
          <>
            <UploadIcon />
            <p className="text-sm text-neutral-400">
              Arraste ou <span className="text-rose-500">clique para selecionar</span>
            </p>
            {hint && <p className="text-xs text-neutral-600">{hint}</p>}
          </>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100)
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falhou: HTTP ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Erro de rede no upload')))
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-neutral-700" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8 8l4-4 4 4" />
    </svg>
  )
}
