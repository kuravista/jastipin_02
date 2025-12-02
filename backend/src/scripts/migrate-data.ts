#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrates data from local PostgreSQL to Supabase
 * 
 * Usage: npx tsx src/scripts/migrate-data.ts
 * 
 * Environment variables required:
 * - LOCAL_DATABASE_URL: PostgreSQL connection to local database
 * - SUPABASE_DATABASE_URL: PostgreSQL connection to Supabase
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Connection strings
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:@localhost:5432/postgres'
const SUPABASE_DB_URL: string = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || ''

if (!SUPABASE_DB_URL) {
  console.error('❌ SUPABASE_DATABASE_URL environment variable is required')
  process.exit(1)
}

// Initialize Prisma clients
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: LOCAL_DB_URL,
    },
  },
})

const supabaseDb = new PrismaClient({
  datasources: {
    db: {
      url: SUPABASE_DB_URL,
    },
  },
})

/**
 * Migration state tracking
 */
interface MigrationResult {
  tableName: string
  sourceCount: number
  targetCount: number
  success: boolean
  error?: string
}

const results: MigrationResult[] = []
let totalRecordsMigrated = 0

/**
 * Migrate a single table
 */
async function migrateTable(tableName: string): Promise<void> {
  console.log(`\n📋 Migrating ${tableName}...`)

  try {
    // Get count from local
    const localCount = await (localDb as any)[tableName].count()
    console.log(`  Local count: ${localCount}`)

    if (localCount === 0) {
      console.log(`  ✓ No records to migrate`)
      results.push({
        tableName,
        sourceCount: 0,
        targetCount: 0,
        success: true,
      })
      return
    }

    // Read data from local
    const data = await (localDb as any)[tableName].findMany({
      take: 10000, // Safety limit
    })

    console.log(`  ✓ Read ${data.length} records from local`)

    // Write to Supabase
    if (data.length > 0) {
      await (supabaseDb as any)[tableName].createMany({
        data,
        skipDuplicates: false,
      })
      console.log(`  ✓ Wrote ${data.length} records to Supabase`)
    }

    // Verify count on Supabase
    const supabaseCount = await (supabaseDb as any)[tableName].count()
    console.log(`  Supabase count: ${supabaseCount}`)

    if (supabaseCount >= localCount) {
      console.log(`  ✅ ${tableName} migrated successfully`)
      results.push({
        tableName,
        sourceCount: localCount,
        targetCount: supabaseCount,
        success: true,
      })
      totalRecordsMigrated += data.length
    } else {
      throw new Error(`Count mismatch: local=${localCount}, supabase=${supabaseCount}`)
    }
  } catch (error: any) {
    console.error(`  ❌ Error migrating ${tableName}:`, error.message)
    results.push({
      tableName,
      sourceCount: 0,
      targetCount: 0,
      success: false,
      error: error.message,
    })
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  🚀 DATA MIGRATION: LOCAL → SUPABASE')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  try {
    // Test connections
    console.log('🔌 Testing connections...')
    console.log(`  Local:    ${LOCAL_DB_URL.substring(0, 50)}...`)
    console.log(`  Supabase: ${SUPABASE_DB_URL.substring(0, 50)}...`)

    // Test local connection
    try {
      await localDb.$queryRaw`SELECT 1`
      console.log('  ✅ Local database connected')
    } catch (error: any) {
      console.warn('  ⚠️  Local database connection warning (may not have access):')
      console.warn(`      ${error.message}`)
      console.log('      Proceeding with Supabase-only checks...')
    }

    // Test Supabase connection
    try {
      await supabaseDb.$queryRaw`SELECT 1`
      console.log('  ✅ Supabase database connected')
    } catch (error: any) {
      console.error('  ❌ Supabase connection failed:')
      console.error(`      ${error.message}`)
      process.exit(1)
    }

    console.log()
    console.log('📊 Starting migration...')
    console.log()

    // Migrate tables in order of dependencies
    const tables: string[] = [
      'user',
      'trip',
      'participant',
      'address',
      'product',
      'order',
      'orderItem',
      'socialMedia',
      'feesConfig',
      'guest',
      'guestAccessToken',
      'bankAccount',
      'notificationLog',
    ]

    for (const table of tables) {
      await migrateTable(table)
    }

    console.log()
    console.log('═══════════════════════════════════════════════════════')
    console.log('  📊 MIGRATION RESULTS')
    console.log('═══════════════════════════════════════════════════════')
    console.log()

    // Summary table
    console.log('Table Summary:')
    console.log('─────────────────────────────────────────────────────')
    results.forEach((r) => {
      const status = r.success ? '✅' : '❌'
      console.log(`${status} ${r.tableName.padEnd(20)} Local: ${String(r.sourceCount).padStart(4)}  Supabase: ${String(r.targetCount).padStart(4)}`)
    })
    console.log('─────────────────────────────────────────────────────')

    // Overall summary
    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    console.log()
    console.log(`✅ Successful: ${successCount}/${results.length} tables`)
    console.log(`❌ Failed: ${failedCount}/${results.length} tables`)
    console.log(`📦 Total records migrated: ${totalRecordsMigrated}`)
    console.log()

    if (failedCount === 0) {
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!')
      console.log()
      console.log('Next steps:')
      console.log('  1. Verify data in Supabase')
      console.log('  2. Update DATABASE_URL to Supabase')
      console.log('  3. Restart API server')
      console.log('  4. Start queue worker')
    } else {
      console.log('⚠️  MIGRATION COMPLETED WITH ERRORS')
      console.log()
      console.log('Failed tables:')
      results.filter((r) => !r.success).forEach((r) => {
        console.log(`  - ${r.tableName}: ${r.error}`)
      })
    }
  } catch (error: any) {
    console.error('❌ Fatal error during migration:')
    console.error(error)
    process.exit(1)
  } finally {
    // Clean up connections
    await localDb.$disconnect()
    await supabaseDb.$disconnect()
  }
}

// Run migration
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
