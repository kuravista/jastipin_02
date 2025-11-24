/**
 * Image Upload Utility for R2
 * Handles file uploads to Cloudflare R2 via backend API
 */

interface UploadImageResponse {
  success: boolean
  url: string
  thumbnailUrl?: string
  key: string
  size: number
  contentType: string
}

export type ImageType = 'avatars' | 'covers' | 'products' | 'trips'

/**
 * Upload image to R2 via backend API
 * @param file File object from input[type="file"]
 * @param type Type of image (avatars, covers, products, trips)
 * @param entityId ID of the entity (userId, productId, tripId)
 * @returns Object with url and optional thumbnailUrl
 */
export async function uploadImage(
  file: File,
  type: ImageType,
  entityId: string
): Promise<{ url: string; thumbnailUrl?: string }> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB')
  }

  // Create FormData
  const formData = new FormData()
  formData.append('file', file)

  // Get token from localStorage
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Authentication required')
  }

  // Upload to backend
  const response = await fetch(
    `/api/images/upload?type=${type}&entityId=${entityId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const data: UploadImageResponse = await response.json()

  return {
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
  }
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
