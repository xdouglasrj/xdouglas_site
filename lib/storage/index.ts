import type { StorageService } from './storage.interface'

export type { StorageService, SignedUploadUrl, SignedDownloadUrl, UploadOptions }
  from './storage.interface'

let _storage: StorageService | null = null

export function getStorage(): StorageService {
  if (_storage) return _storage

  // Em produção e preview, sempre R2
  if (process.env.NODE_ENV === 'production' || process.env.R2_ACCOUNT_ID) {
    const { R2StorageProvider } = require('./r2.provider')
    _storage = new R2StorageProvider()
    return _storage!
  }

  // Desenvolvimento sem credenciais R2 — provider local simulado
  const { LocalStorageProvider } = require('./local.provider')
  _storage = new LocalStorageProvider()
  return _storage!
}
