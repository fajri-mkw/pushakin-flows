import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST - Login with email and password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password harus diisi' }, { status: 400 })
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Check if user has a real password (not placeholder)
    if (user.password === '$2a$10$placeholder') {
      // User hasn't set password yet, allow first login with default password
      const defaultPassword = 'pushakin123'
      if (password !== defaultPassword) {
        return NextResponse.json({ 
          error: 'Password default salah. Hubungi administrator.',
          requiresDefaultPassword: true 
        }, { status: 401 })
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Login berhasil. Silakan ganti password Anda.',
        mustChangePassword: true
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat login' }, { status: 500 })
  }
}
