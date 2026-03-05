import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a new PrismaClient to avoid stale connections
// In development with hot reload, the cached client can have issues
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// In production, reuse the same client
// In development, always create fresh client to avoid schema mismatch
export const db = process.env.NODE_ENV === 'production' 
  ? (globalForPrisma.prisma ?? createPrismaClient())
  : createPrismaClient()

if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = db
}

// Helper to ensure database connection
export async function ensureDbConnection() {
  try {
    await db.$connect()
    // Test query to make sure connection works
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
