'use client'

import { useRef, useState } from 'react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const CATEGORIES = [
  { value: 'BUG', label: 'Problema / erro' },
  { value: 'SUGESTAO', label: 'Sugestão' },
  { value: 'DUVIDA', label: 'Dúvida' },
  { value: 'OUTRO', label: 'Outro' },
] as const

type Attachment = { key: string; url: string; type: 'IMAGE' | 'VIDEO' }

export function SupportForm() {
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('BUG')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Formato não suportado. Use JPG, PNG, WebP, MP4, MOV ou WebM.')
      return
    }

    const isImage = file.type.startsWith('image/')
    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    if (file.size > maxBytes) {
      setUploadError(`Arquivo muito grande. Máximo: ${Math.round(maxBytes / (1024 * 1024))}MB`)
      return
    }

    setUploadState('uploading')
    try {
      const urlRes = await fetch('/api/support/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao gerar URL de upload')
      }

      const { uploadUrl, storageKey, publicUrl, attachmentType } = await urlRes.json()

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Falha ao enviar o arquivo')

      setAttachment({ key: storageKey, url: publicUrl, type: attachmentType })
      setAttachmentPreview(isImage ? publicUrl : null)
      setUploadState('idle')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload')
      setUploadState('error')
      setTimeout(() => setUploadState('idle'), 3000)
    }
  }

  function removeAttachment() {
    setAttachment(null)
    setAttachmentPreview(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (message.trim().length < 10) {
      setError('Descreva o problema com um pouco mais de detalhe.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          attachment: attachment ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar o chamado')
        return
      }

      setSent(true)
      setMessage('')
      removeAttachment()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
        Recebemos sua mensagem! Nosso time vai analisar e, se precisar te responder, faremos contato pelo e-mail da sua conta.
        <button
          type="button"
          onClick={() => setSent(false)}
          className="ml-2 underline hover:opacity-80"
        >
          Abrir outro chamado
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-gate-pink/40 bg-gate-pink/10 px-4 py-3 text-sm text-gate-pink">
          {error}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">
          Tipo
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === c.value
                  ? 'border-gate-pink bg-gate-pink/15 text-gate-pink'
                  : 'border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">
          Descreva o que aconteceu
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="Quanto mais detalhes (o que você fez, o que esperava ver, o que aconteceu de fato), mais rápido conseguimos ajudar…"
          className="w-full resize-y rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">
          Foto ou vídeo (opcional)
        </label>

        {attachment ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 rounded-lg border border-gate-azure bg-white/5 p-3">
              {attachmentPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachmentPreview} alt="Anexo" className="h-14 w-14 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white/10 text-gate-blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="15" height="16" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l5-3v12l-5-3" />
                  </svg>
                </div>
              )}
              <div className="flex-1 text-xs text-white/60">
                {attachment.type === 'IMAGE' ? 'Imagem anexada' : 'Vídeo anexado'}
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="text-xs font-medium text-gate-pink hover:opacity-80"
              >
                Remover
              </button>
            </div>
            {attachment.type === 'VIDEO' && (
              <p className="text-[11px] text-white/40">
                O vídeo será excluído automaticamente em 7 dias. A descrição que você escreveu continua registrada no seu chamado.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className="flex w-fit items-center gap-2 rounded-lg border border-dashed border-gate-azure px-4 py-3 text-sm text-gate-blue transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M8 8l4-4 4 4" />
              </svg>
              {uploadState === 'uploading' ? 'Enviando…' : 'Adicionar foto ou vídeo'}
            </button>
            <span className="text-[11px] text-white/40">Imagem até 8MB ou vídeo até 50MB</span>
            {uploadError && <span className="text-[11px] text-red-400">{uploadError}</span>}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={busy || uploadState === 'uploading'}
        className="w-fit rounded-lg bg-gate-pink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? 'Enviando…' : 'Enviar chamado'}
      </button>
    </form>
  )
}
