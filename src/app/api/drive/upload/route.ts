import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

// Create Google Drive client from service account
function getDriveClient(serviceAccountKey: string) {
  const credentials = JSON.parse(serviceAccountKey)
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  })
  
  return google.drive({ version: 'v3', auth })
}

// POST - Upload file to Google Drive
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        details: 'Please select a file to upload'
      }, { status: 400 })
    }

    if (!folderId) {
      return NextResponse.json({ 
        error: 'No folder ID provided',
        details: 'Folder ID is required'
      }, { status: 400 })
    }

    // Get settings
    const settings = await db.settings.findUnique({
      where: { id: 'main' }
    })
    
    if (!settings?.driveServiceAccountKey) {
      return NextResponse.json({ 
        error: 'Google Service Account not configured',
        details: 'Please configure Google Drive in settings'
      }, { status: 400 })
    }

    const drive = getDriveClient(settings.driveServiceAccountKey)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId]
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: Readable.from(buffer)
      },
      fields: 'id, name, webViewLink, size',
      supportsAllDrives: true
    })

    console.log('[DRIVE UPLOAD] File uploaded:', response.data.id, response.data.name)

    // Log to project if projectId provided
    if (projectId && response.data.id) {
      try {
        console.log(`[DRIVE UPLOAD] File uploaded for project ${projectId}: ${response.data.name}`)
      } catch (logError) {
        console.error('[DRIVE UPLOAD] Failed to log upload:', logError)
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        size: response.data.size
      }
    })
  } catch (error) {
    console.error('[DRIVE UPLOAD] Upload error:', error)
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json({ 
          error: 'Storage quota exceeded',
          details: 'The Google Drive storage quota has been exceeded'
        }, { status: 507 })
      }
      
      if (error.message.includes('permission')) {
        return NextResponse.json({ 
          error: 'Permission denied',
          details: 'The service account does not have permission to upload to this folder'
        }, { status: 403 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
