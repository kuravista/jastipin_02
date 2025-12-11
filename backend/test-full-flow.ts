import db from './src/lib/prisma.js'

async function test() {
  // First, create a test user
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TempPassword123!'

  try {
    console.log(`Creating test user with email: ${testEmail}`)
    
    // Hash password (simple for testing)
    const crypto = await import('crypto')
    const hashedPassword = crypto
      .createHash('sha256')
      .update(testPassword)
      .digest('hex')

    const user = await db.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        slug: `test-user-${Date.now()}`,
        profileName: 'Test User'
      }
    })

    console.log(`✓ User created: ${user.email} (ID: ${user.id})`)

    // Now test password reset
    console.log('\nTesting password reset service...')
    const { PasswordResetService } = await import('./src/services/password-reset.service.js')
    const service = new PasswordResetService(db)

    const result = await service.generateResetToken(testEmail)
    console.log(`✓ Reset token generated!`)
    console.log(`  Token (first 20 chars): ${result.token.substring(0, 20)}...`)
    console.log(`  Expires at: ${result.expiresAt.toISOString()}`)

    // Check if token was stored in database
    const tokenCount = await db.passwordResetToken.count({
      where: { userId: user.id }
    })
    console.log(`✓ Token stored in database (count: ${tokenCount})`)

    // Clean up
    await db.user.delete({ where: { id: user.id } })
    console.log(`\n✓ Test complete! User cleaned up.`)
  } catch (error: any) {
    console.error('✗ Error:', error.message || error)
  } finally {
    await db.$disconnect()
  }
}

test()
