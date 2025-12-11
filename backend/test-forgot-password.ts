import db from './src/lib/prisma.js'
import { PasswordResetService } from './src/services/password-reset.service.js'

const service = new PasswordResetService(db)

async function test() {
  try {
    const result = await service.generateResetToken('test@example.com')
    console.log('Success:', result)
  } catch (error: any) {
    console.error('Error:', error.message || error)
  } finally {
    await db.$disconnect()
  }
}

test()
