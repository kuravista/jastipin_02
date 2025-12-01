/**
 * Prisma Client Singleton
 * Ensures only one PrismaClient instance is created and reused across the application
 * Prevents "prepared statement already exists" errors from multiple instances
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') global.prisma = db

export default db
