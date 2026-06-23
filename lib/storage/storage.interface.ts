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

export interface StorageService {
  /**
   * Gera URL pré-assinada para upload direto (browser → storage)
   * O servidor nunca trafega o binário
   */
  getSignedUploadUrl(
    key: string,
    options: UploadOptions
  ): Promise<SignedUploadUrl>

  /**
   * Gera URL temporária para download (TTL 15 min padrão)
   */
  getSignedDownloadUrl(
    key: string,
    ttlSeconds?: number
  ): Promise<SignedDownloadUrl>

  /**
   * Deleta um objeto do storage
   */
  delete(key: string): Promise<void>

  /**
   * Retorna URL pública (apenas para objetos em bucket público, ex: capas)
   */
  getPublicUrl(key: string): string
}
