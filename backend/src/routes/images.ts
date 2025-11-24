/**
 * Image Upload Routes
 * POST /api/images/upload?type=avatar|cover|product|trip&entityId=xxx
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { R2Service } from '../services/r2.service.js'

const router = Router()

// Parse multipart file helper (reuse from file-upload.ts logic)
function parseMultipartFile(req: Request): Promise<{
  buffer: Buffer
  filename: string
  mimetype: string
}> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let fileSize = 0
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const contentType = req.headers['content-type'] || ''

    if (!contentType.includes('multipart/form-data')) {
      reject(new Error('Content-Type must be multipart/form-data'))
      return
    }

    const boundary = contentType.split('boundary=')[1]
    if (!boundary) {
      reject(new Error('Invalid multipart boundary'))
      return
    }

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      fileSize += chunk.length

      if (fileSize > MAX_FILE_SIZE) {
        req.pause()
        reject(new Error('File size exceeds 5MB limit'))
      }
    })

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks)
        const parts = buffer.toString('binary').split(`--${boundary}`)

        let fileData: Buffer | null = null
        let filename = ''
        let mimetype = ''

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="file"') ||
              part.includes('Content-Disposition: form-data; name="image"')) {
            const headerEnd = part.indexOf('\r\n\r\n')
            const header = part.substring(0, headerEnd)

            const filenameMatch = header.match(/filename="([^"]+)"/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }

            const contentTypeMatch = header.match(/Content-Type: ([^\r\n]+)/)
            if (contentTypeMatch) {
              mimetype = contentTypeMatch[1].trim()
            }

            const dataStart = headerEnd + 4
            const dataEnd = part.lastIndexOf('\r\n')
            const binaryData = part.substring(dataStart, dataEnd)

            fileData = Buffer.from(binaryData, 'binary')
            break
          }
        }

        if (!fileData || !filename) {
          reject(new Error('No file found in request'))
          return
        }

        resolve({
          buffer: fileData,
          filename,
          mimetype: mimetype || 'application/octet-stream',
        })
      } catch (error: any) {
        reject(new Error(`File parsing failed: ${error.message}`))
      }
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * POST /api/images/upload
 * Upload image to R2
 * Query params:
 *   - type: 'avatars' | 'covers' | 'products' | 'trips'
 *   - entityId: ID of the entity (userId, productId, tripId)
 */
router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string
    const entityId = req.query.entityId as string

    // Validate params
    if (!type || !['avatars', 'covers', 'products', 'trips'].includes(type)) {
      res.status(400).json({
        error: 'Invalid or missing type parameter. Must be: avatars, covers, products, or trips',
      })
      return
    }

    if (!entityId) {
      res.status(400).json({
        error: 'Missing entityId parameter',
      })
      return
    }

    // Parse file
    const { buffer, filename, mimetype } = await parseMultipartFile(req)

    // Validate file type (images only)
    if (!mimetype.startsWith('image/')) {
      res.status(400).json({
        error: 'Invalid file type. Only images are allowed',
      })
      return
    }

    // Upload to R2
    const r2Service = new R2Service()
    const result = await r2Service.uploadImage(
      buffer,
      type as 'avatars' | 'covers' | 'products' | 'trips',
      entityId,
      filename,
      mimetype,
      {
        optimize: true,
        generateThumbnail: type === 'avatars' || type === 'products',
      }
    )

    res.json({
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
    })
  } catch (error: any) {
    console.error('Image upload failed:', error)
    res.status(500).json({
      error: error.message || 'Failed to upload image',
    })
  }
})

export default router
