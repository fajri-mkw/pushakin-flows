import { NextResponse } from 'next/server'

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'NOT SET',
  }

  return NextResponse.json(debugInfo)
}

export async function POST() {
  try {
    // Try to import and use Prisma
    const { db } = await import('@/lib/db')
    
    // Try a simple query
    const userCount = await db.user.count()
    
    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    }, { status: 500 })
  }
}
