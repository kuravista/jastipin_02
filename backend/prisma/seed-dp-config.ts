import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding FeesConfig...')

  const dpConfig = await db.feesConfig.upsert({
    where: {
      scope_calculationType: {
        scope: 'dp_percent',
        calculationType: 'percent'
      }
    },
    update: {
      value: 20, // Update to 20% if exists
      isActive: true
    },
    create: {
      scope: 'dp_percent',
      calculationType: 'percent',
      value: 20, // Default 20%
      isActive: true,
      meta: { description: 'Down Payment percentage for orders' }
    }
  })

  console.log('DP Config seeded:', dpConfig)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
