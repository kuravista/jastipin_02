/**
 * Cloudflare R2 Service
 * Handles file uploads, deletions, and management for payment proofs
 */

import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// Lazy load sharp only when needed to avoid CPU architecture issues
let sharp: any = null
let sharpLoadAttempted = false
let sharpAvailable = false

const loadSharp = async () => {
  if (!sharpLoadAttempted) {
    sharpLoadAttempted = true
    try {
      sharp = (await import('sharp')).default
      sharpAvailable = true
    } catch (error) {
      console.warn('Sharp not available, image optimization disabled')
      sharpAvailable = false
      sharp = null
    }
  }
  return sharpAvailable ? sharp : null
}

interface UploadOptions {
  optimize?: boolean
  maxWidth?: number
  quality?: number
  generateThumbnail?: boolean
}

interface UploadResult {
  url: string
  key: string
  thumbnailUrl?: string
  thumbnailKey?: string
  size: number
  contentType: string
}

export class R2Service {
  private client: S3Client
  private bucketName: string
  private publicUrl: string

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucketName = process.env.R2_BUCKET_NAME
    const publicUrl = process.env.R2_CUSTOMED_DOMAIN || process.env.R2_PUBLIC_URL

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error('Missing R2 configuration. Please check environment variables.')
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    this.bucketName = bucketName
    this.publicUrl = publicUrl
  }

  /**
   * Generate unique key for file storage
   */
  generateKey(orderId: string, originalFilename: string, suffix?: string): string {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const suffixPart = suffix ? `-${suffix}` : ''
    return `img/payment-proofs/${orderId}/${timestamp}-${random}${suffixPart}.${ext}`
  }

  /**
   * Generate key for general images (avatars, covers, products, trips)
   */
  generateImageKey(
    type: 'avatars' | 'covers' | 'products' | 'trips',
    entityId: string,
    originalFilename: string,
    suffix?: string
  ): string {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const suffixPart = suffix ? `-${suffix}` : ''
    return `img/${type}/${entityId}/${timestamp}-${random}${suffixPart}.${ext}`
  }

  /**
   * Optimize image buffer using Sharp
   */
  private async optimizeImage(
    buffer: Buffer,
    maxWidth: number = 1920,
    quality: number = 85
  ): Promise<Buffer | null> {
    const sharpInstance = await loadSharp()
    if (!sharpInstance) {
      return null
    }
    try {
      return await sharpInstance(buffer)
        .resize(maxWidth, maxWidth, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
    } catch (error) {
      console.error('Sharp optimization error:', error)
      return null
    }
  }

  /**
   * Generate thumbnail from image buffer
   */
  private async generateThumbnail(
    buffer: Buffer,
    size: number = 300,
    quality: number = 70
  ): Promise<Buffer | null> {
    const sharpInstance = await loadSharp()
    if (!sharpInstance) {
      return null
    }
    try {
      return await sharpInstance(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
    } catch (error) {
      console.error('Sharp thumbnail error:', error)
      return null
    }
  }

  /**
   * Upload file to R2
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      },
    })

    await upload.done()
    return `${this.publicUrl}/${key}`
  }

  /**
   * Upload payment proof with optimization
   */
  async uploadPaymentProof(
    buffer: Buffer,
    orderId: string,
    originalFilename: string,
    contentType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      optimize = true,
      maxWidth = 1920,
      quality = 85,
      generateThumbnail = true,
    } = options

    let finalBuffer = buffer
    let finalContentType = contentType

    // Optimize image if it's an image type
    if (optimize && contentType.startsWith('image/')) {
      const optimizedBuffer = await this.optimizeImage(buffer, maxWidth, quality)
      if (optimizedBuffer) {
        finalBuffer = optimizedBuffer
        finalContentType = 'image/jpeg' // Always convert to JPEG after optimization
      }
    }

    // Generate main file key and upload
    const key = this.generateKey(orderId, originalFilename)
    const url = await this.uploadFile(finalBuffer, key, finalContentType)

    const result: UploadResult = {
      url,
      key,
      size: finalBuffer.length,
      contentType: finalContentType,
    }

    // Generate and upload thumbnail if requested and is image
    if (generateThumbnail && contentType.startsWith('image/')) {
      const thumbnailBuffer = await this.generateThumbnail(finalBuffer)
      
      if (thumbnailBuffer) {
        const thumbnailKey = this.generateKey(orderId, originalFilename, 'thumb')
        const thumbnailUrl = await this.uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg')

        result.thumbnailUrl = thumbnailUrl
        result.thumbnailKey = thumbnailKey
      }
    }

    return result
  }

  /**
   * Upload general image (avatar, cover, product, trip)
   */
  async uploadImage(
    buffer: Buffer,
    type: 'avatars' | 'covers' | 'products' | 'trips',
    entityId: string,
    originalFilename: string,
    contentType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      optimize = true,
      maxWidth = type === 'avatars' ? 800 : 1920,
      quality = 85,
      generateThumbnail = type === 'avatars' || type === 'products',
    } = options

    let finalBuffer = buffer
    let finalContentType = contentType

    // Optimize image if it's an image type
    if (optimize && contentType.startsWith('image/')) {
      const optimizedBuffer = await this.optimizeImage(buffer, maxWidth, quality)
      if (optimizedBuffer) {
        finalBuffer = optimizedBuffer
        finalContentType = 'image/jpeg'
      }
    }

    // Generate main file key and upload
    const key = this.generateImageKey(type, entityId, originalFilename)
    const url = await this.uploadFile(finalBuffer, key, finalContentType)

    const result: UploadResult = {
      url,
      key,
      size: finalBuffer.length,
      contentType: finalContentType,
    }

    // Generate and upload thumbnail if requested
    if (generateThumbnail && contentType.startsWith('image/')) {
      const thumbnailSize = type === 'avatars' ? 200 : 300
      const thumbnailBuffer = await this.generateThumbnail(finalBuffer, thumbnailSize)
      
      if (thumbnailBuffer) {
        const thumbnailKey = this.generateImageKey(type, entityId, originalFilename, 'thumb')
        const thumbnailUrl = await this.uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg')

        result.thumbnailUrl = thumbnailUrl
        result.thumbnailKey = thumbnailKey
      }
    }

    return result
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
      await this.client.send(command)
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error)
      throw error
    }
  }

  /**
   * Delete payment proof and its thumbnail
   */
  async deletePaymentProof(proofUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(proofUrl)
      if (!key) {
        throw new Error('Invalid proof URL')
      }

      // Delete main file
      await this.deleteFile(key)

      // Try to delete thumbnail if exists
      const thumbnailKey = key.replace(/\.(jpg|jpeg|png)$/, '-thumb.$1')
      try {
        await this.deleteFile(thumbnailKey)
      } catch (error) {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      console.error('Failed to delete payment proof:', error)
      throw error
    }
  }

  /**
   * Check if file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
      await this.client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Extract key from public URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      // Remove leading slash
      return urlObj.pathname.substring(1)
    } catch (error) {
      return null
    }
  }

  /**
   * Get file URL from key
   */
  getFileUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }
}
