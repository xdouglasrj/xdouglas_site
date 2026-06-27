export interface UploadOptions {
  contentType: string
  maxSizeBytes?: number
  metadata?: Record<string, string>
}

export interface SignedUploadUrl {
  uploadUrl: string    // URL para o cliente fazer PUT direto no storage
  storageKey: string   // chave a salvar no banco
  expiresAt: Date
}

export interface SignedDownloadUrl {
  downloadUrl: string  // URL temporária para o cliente baixar
  expiresAt: Date
}

/**
 * 'public'  — bucket com acesso público (capas, avatars, anexos de suporte)
 * 'private' — bucket sem acesso público (áudio de música e vinheta) — só
 *              acessível via URL assinada com TTL curto
 */
export type StorageBucket = 'public' | 'private'

export interface StorageService {
  /**
   * Gera URL pré-assinada para upload direto (browser → storage)
   * O servidor nunca trafega o binário
   */
  getSignedUploadUrl(
    key: string,
    options: UploadOptions,
    bucket?: StorageBucket
  ): Promise<SignedUploadUrl>

  /**
   * Gera URL temporária para download (TTL 15 min padrão)
   */
  getSignedDownloadUrl(
    key: string,
    ttlSeconds?: number,
    bucket?: StorageBucket
  ): Promise<SignedDownloadUrl>

  /**
   * Deleta um objeto do storage
   */
  delete(key: string, bucket?: StorageBucket): Promise<void>

  /**
   * Retorna URL pública — só existe pro bucket público (capas/avatars)
   */
  getPublicUrl(key: string): string
}
