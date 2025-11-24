/**
 * Image Upload Utility for R2
 * Handles file uploads to Cloudflare R2 via backend API with client-side compression
 */

import imageCompression from 'browser-image-compression'

interface UploadImageResponse {
  success: boolean
  url: string
  thumbnailUrl?: string
  key: string
  size: number
  contentType: string
}

export type ImageType = 'avatars' | 'covers' | 'products' | 'trips'

export interface UploadProgress {
  percent: number
  loaded: number
  total: number
}

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
}

/**
 * Compress image on client-side before upload
 * Reduces file size significantly for faster uploads (typically 3-6x smaller)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
  } = options

  // Skip compression for small files (< 200KB)
  if (file.size < 200 * 1024) {
    return file
  }

  try {
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      fileType: 'image/jpeg' as const,
      initialQuality: 0.85,
    }

    const compressedFile = await imageCompression(file, compressionOptions)
    
    // If compression didn't help much, return original
    if (compressedFile.size > file.size * 0.9) {
      return file
    }
    
    return compressedFile
  } catch (error) {
    console.warn('Image compression failed, using original:', error)
    return file
  }
}

/**
 * Upload image to R2 via backend API with progress tracking
 * @param file File object from input[type="file"]
 * @param type Type of image (avatars, covers, products, trips)
 * @param entityId ID of the entity (userId, productId, tripId)
 * @param onProgress Optional callback for upload progress updates
 * @returns Object with url and optional thumbnailUrl
 */
export async function uploadImage(
  file: File,
  type: ImageType,
  entityId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; thumbnailUrl?: string }> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB')
  }

  // Get token from localStorage
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Authentication required')
  }

  // Compress image first for faster upload
  const compressedFile = await compressImage(file)

  // Create FormData
  const formData = new FormData()
  formData.append('file', compressedFile)

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((e.loaded / e.total) * 100),
          loaded: e.loaded,
          total: e.total,
        })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: UploadImageResponse = JSON.parse(xhr.responseText)
          resolve({
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
          })
        } catch (error) {
          reject(new Error('Invalid response from server'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.error || 'Failed to upload image'))
        } catch {
          reject(new Error('Upload failed'))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'))
    })

    xhr.open('POST', `/api/images/upload?type=${type}&entityId=${entityId}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

/**
 * Get user ID from token (helper function)
 */
export function getUserIdFromToken(): string {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Not authenticated')
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub // JWT uses 'sub' field for userId
  } catch (error) {
    throw new Error('Invalid token')
  }
}
