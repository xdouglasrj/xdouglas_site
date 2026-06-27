import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  StorageService,
  StorageBucket,
  UploadOptions,
  SignedUploadUrl,
  SignedDownloadUrl,
} from './storage.interface'

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY são obrigatórias'
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export class R2StorageProvider implements StorageService {
  private client: S3Client
  private bucketPublic: string
  private bucketPrivate: string
  private publicUrl: string

  constructor() {
    this.client = getR2Client()
    this.bucketPublic = process.env.R2_BUCKET_NAME_PUBLIC ?? ''
    this.bucketPrivate = process.env.R2_BUCKET_NAME_PRIVATE ?? ''
    this.publicUrl = process.env.R2_PUBLIC_URL ?? ''

    if (!this.bucketPublic) throw new Error('R2_BUCKET_NAME_PUBLIC não definido')
    if (!this.bucketPrivate) throw new Error('R2_BUCKET_NAME_PRIVATE não definido')
    if (!this.publicUrl) throw new Error('R2_PUBLIC_URL não definido')
  }

  private resolveBucket(bucket: StorageBucket): string {
    return bucket === 'private' ? this.bucketPrivate : this.bucketPublic
  }

  async getSignedUploadUrl(
    key: string,
    options: UploadOptions,
    bucket: StorageBucket = 'public'
  ): Promise<SignedUploadUrl> {
    const TTL_SECONDS = 300 // 5 minutos para o upload completar

    const command = new PutObjectCommand({
      Bucket: this.resolveBucket(bucket),
      Key: key,
      ContentType: options.contentType,
      ...(options.metadata && { Metadata: options.metadata }),
    })

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: TTL_SECONDS,
    })

    return {
      uploadUrl,
      storageKey: key,
      expiresAt: new Date(Date.now() + TTL_SECONDS * 1000),
    }
  }

  async getSignedDownloadUrl(
    key: string,
    ttlSeconds = 900, // 15 minutos padrão
    bucket: StorageBucket = 'public'
  ): Promise<SignedDownloadUrl> {
    // R2 usa GetObjectCommand para download pré-assinado
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')

    const command = new GetObjectCommand({
      Bucket: this.resolveBucket(bucket),
      Key: key,
    })

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds,
    })

    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    }
  }

  async delete(key: string, bucket: StorageBucket = 'public'): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.resolveBucket(bucket), Key: key })
    )
  }

  getPublicUrl(key: string): string {
    const base = this.publicUrl.replace(/\/$/, '')
    return `${base}/${key}`
  }
}
