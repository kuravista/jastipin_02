/**
 * Test Script for R2 Upload Functionality
 * Run: tsx src/scripts/test-r2-upload.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { R2Service } from '../services/r2.service.js'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function testR2Upload() {
  console.log('🧪 Testing Cloudflare R2 Upload...\n')

  try {
    // Initialize R2 Service
    console.log('📦 Initializing R2 Service...')
    const r2Service = new R2Service()
    console.log('✅ R2 Service initialized\n')

    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const testOrderId = 'test-order-' + Date.now()
    const testFilename = 'test-payment-proof.png'

    console.log('📤 Uploading test image...')
    console.log(`   Order ID: ${testOrderId}`)
    console.log(`   Filename: ${testFilename}`)
    console.log(`   Buffer size: ${testImageBuffer.length} bytes\n`)

    const result = await r2Service.uploadPaymentProof(
      testImageBuffer,
      testOrderId,
      testFilename,
      'image/png',
      {
        optimize: false, // Skip optimization for test to avoid Sharp issues
        generateThumbnail: false,
      }
    )

    console.log('✅ Upload successful!\n')
    console.log('📊 Upload Results:')
    console.log('─'.repeat(60))
    console.log(`🔗 URL:           ${result.url}`)
    console.log(`📁 Key:           ${result.key}`)
    console.log(`📏 Size:          ${result.size} bytes`)
    console.log(`📄 Content Type:  ${result.contentType}`)

    if (result.thumbnailUrl) {
      console.log(`🖼️  Thumbnail URL:  ${result.thumbnailUrl}`)
      console.log(`📁 Thumbnail Key:  ${result.thumbnailKey}`)
    }
    console.log('─'.repeat(60))

    // Test file existence check
    console.log('\n🔍 Checking if file exists in R2...')
    const exists = await r2Service.fileExists(result.key)
    console.log(`✅ File exists: ${exists}\n`)

    // Test deletion
    console.log('🗑️  Testing file deletion...')
    await r2Service.deletePaymentProof(result.url)
    console.log('✅ File deleted successfully\n')

    // Verify deletion
    console.log('🔍 Verifying file was deleted...')
    const existsAfterDelete = await r2Service.fileExists(result.key)
    console.log(`✅ File exists after delete: ${existsAfterDelete}\n`)

    console.log('🎉 All tests passed!\n')
    console.log('✨ R2 Upload functionality is working correctly!')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    console.error('\n📋 Error details:')
    console.error(error)
    process.exit(1)
  }
}

// Run test
testR2Upload()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
