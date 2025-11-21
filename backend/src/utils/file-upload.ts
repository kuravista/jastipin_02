/**
 * Simple File Upload Handler (Temporary Local Storage)
 * Will be replaced with Cloudflare R2 in production
 */

import fs from 'fs'
import path from 'path'
import { Request } from 'express'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'payment-proofs')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface UploadedFile {
  filename: string
  path: string
  size: number
  mimetype: string
}

export function ensureUploadDirExists(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export async function handleFileUpload(req: Request): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let fileSize = 0
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

    let fileData: Buffer | null = null
    let filename = ''
    let mimetype = ''

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

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="file"')) {
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

        const ext = path.extname(filename)
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filePath = path.join(UPLOAD_DIR, uniqueFilename)

        ensureUploadDirExists()
        fs.writeFileSync(filePath, fileData)

        resolve({
          filename: uniqueFilename,
          path: filePath,
          size: fileData.length,
          mimetype: mimetype || 'application/octet-stream'
        })
      } catch (error: any) {
        reject(new Error(`File upload failed: ${error.message}`))
      }
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function getFileUrl(filename: string): string {
  return `/uploads/payment-proofs/${filename}`
}
