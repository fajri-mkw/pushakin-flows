import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT update drive folder links
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, folders } = body
    
    // Update each folder
    const updates = await Promise.all(
      folders.map((f: { id: string; link: string }) => 
        db.driveFolder.update({
          where: { id: f.id },
          data: { link: f.link }
        })
      )
    )
    
    return NextResponse.json({ success: true, count: updates.length })
  } catch (error) {
    console.error('Update drive folders error:', error)
    return NextResponse.json({ error: 'Failed to update drive folders' }, { status: 500 })
  }
}
