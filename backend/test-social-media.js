import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function testAddSocialMedia() {
  try {
    // Find Ahmad's user ID
    const user = await db.user.findUnique({
      where: { slug: 'ahmad-wijaya' }
    })

    if (!user) {
      console.log('User not found')
      return
    }

    console.log('User found:', user.id)

    // Add social media accounts
    const socialMedias = await Promise.all([
      db.socialMedia.create({
        data: {
          userId: user.id,
          platform: 'INSTAGRAM',
          handle: 'ahmad.wijaya',
          url: 'https://instagram.com/ahmad.wijaya'
        }
      }),
      db.socialMedia.create({
        data: {
          userId: user.id,
          platform: 'YOUTUBE',
          handle: '@ahmadwijaya',
          url: 'https://youtube.com/@ahmadwijaya'
        }
      }),
      db.socialMedia.create({
        data: {
          userId: user.id,
          platform: 'TIKTOK',
          handle: 'ahmad_wijaya_',
          url: 'https://tiktok.com/@ahmad_wijaya_'
        }
      }),
      db.socialMedia.create({
        data: {
          userId: user.id,
          platform: 'SHOPEE',
          handle: 'ahmad_shop_official',
          url: 'https://shopee.co.id/ahmad_shop_official'
        }
      }),
      db.socialMedia.create({
        data: {
          userId: user.id,
          platform: 'WHATSAPP',
          handle: '+628123987654',
          url: 'https://wa.me/628123987654'
        }
      })
    ])

    console.log('Added', socialMedias.length, 'social media accounts')
    socialMedias.forEach(sm => {
      console.log(`- ${sm.platform}: ${sm.handle}`)
    })
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await db.$disconnect()
  }
}

testAddSocialMedia()
