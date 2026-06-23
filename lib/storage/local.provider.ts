import type {
  StorageService,
  UploadOptions,
  SignedUploadUrl,
  SignedDownloadUrl,
} from './storage.interface'

/**
 * Provider de desenvolvimento — simula o storage com URLs localhost.
 * Em dev, os arquivos devem ser colocados em /public/dev-storage/
 * e referenciados pela URL pública.
 *
 * NUNCA usar em produção.
 */
export class LocalStorageProvider implements StorageService {
  private baseUrl: string

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    console.warn(
      '[Storage] Usando LocalStorageProvider. Configure R2 para produção.'
    )
  }

  async getSignedUploadUrl(
    key: string,
    _options: UploadOptions
  ): Promise<SignedUploadUrl> {
    // Em dev, retorna endpoint local de upload
    return {
      uploadUrl: `${this.baseUrl}/api/dev/upload?key=${encodeURIComponent(key)}`,
      storageKey: key,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }
  }

  async getSignedDownloadUrl(
    key: string,
    _ttlSeconds = 900
  ): Promise<SignedDownloadUrl> {
    return {
      downloadUrl: `${this.baseUrl}/dev-storage/${key}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }
  }

  async delete(_key: string): Promise<void> {
    console.log(`[LocalStorage] delete: ${_key}`)
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/dev-storage/${key}`
  }
}
