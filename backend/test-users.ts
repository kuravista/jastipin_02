import db from './src/lib/prisma.js'

async function test() {
  const users = await db.user.findMany({ select: { email: true }, take: 3 })
  console.log('Existing users:', users)
  
  if (users.length > 0) {
    const testEmail = users[0].email
    console.log(`\nTesting with email: ${testEmail}`)
    
    // Now test password reset
    const { PasswordResetService } = await import('./src/services/password-reset.service.js')
    const service = new PasswordResetService(db)
    
    try {
      const result = await service.generateResetToken(testEmail)
      console.log('Token generated successfully:', result)
    } catch (error: any) {
      console.error('Error generating token:', error.message || error)
    }
  }
  
  await db.$disconnect()
}

test()
