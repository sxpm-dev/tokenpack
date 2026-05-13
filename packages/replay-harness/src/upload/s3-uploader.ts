import { readFile } from 'node:fs/promises'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { logger } from '../log/logger.js'

export interface UploadConfig {
  endpoint: string
  region: string
  bucket: string
  publicBaseUrl: string
  accessKeyId: string
  secretAccessKey: string
}

export function uploadConfigFromEnv(): UploadConfig {
  const need = (k: string): string => {
    const v = process.env[k]

    if (!v) throw new Error(`Missing env: ${k}`)

    return v
  }

  return {
    endpoint: need('REPLAY_UPLOAD_ENDPOINT'),
    region: process.env.REPLAY_UPLOAD_REGION ?? 'auto',
    bucket: need('REPLAY_UPLOAD_BUCKET'),
    publicBaseUrl: need('REPLAY_UPLOAD_PUBLIC_BASE'),
    accessKeyId: need('REPLAY_UPLOAD_ACCESS_KEY'),
    secretAccessKey: need('REPLAY_UPLOAD_SECRET_KEY'),
  }
}

export async function uploadPack(
  config: UploadConfig,
  packPath: string,
  objectKey: string,
): Promise<string> {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  })

  const body = await readFile(packPath)

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: body,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=300',
    }),
  )

  const publicUrl = `${config.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`

  logger.info({ publicUrl, bytes: body.byteLength }, 'pack uploaded')

  return publicUrl
}
