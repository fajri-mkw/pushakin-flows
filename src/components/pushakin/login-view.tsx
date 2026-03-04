'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { PlayCircle, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LoginViewProps {
  onSeed: () => Promise<void>
  isSeeding: boolean
  seedError?: string
}

export function LoginView({ onSeed, isSeeding, seedError }: LoginViewProps) {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser)
  const showAlert = useAppStore((state) => state.showAlert)
  
  const [hasUsers, setHasUsers] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<{id: string, name: string} | null>(null)

  // Check if users exist
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const res = await fetch('/api/users')
        const users = await res.json()
        setHasUsers(users.length > 0)
      } catch {
        setHasUsers(false)
      }
    }
    checkUsers()
  }, [isSeeding])

  // Loading state
  if (hasUsers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // No users - show seed button
  if (!hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100 p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30">
              <PlayCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Pushakin Flows</h1>
            <div className="mt-2">
              <p className="text-sm font-semibold text-violet-600">Sistem Manajemen Produksi</p>
              <p className="text-xs text-slate-500">Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi</p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              Database belum diinisialisasi. Klik tombol di bawah untuk membuat data demo.
            </p>
            {seedError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Gagal menginisialisasi database</p>
                  <p className="text-xs mt-1 text-red-600">{seedError}</p>
                  <p className="text-xs mt-2 text-red-500">Pastikan DATABASE_URL sudah dikonfigurasi dengan benar di Vercel.</p>
                </div>
              </div>
            )}
            <Button 
              onClick={onSeed} 
              disabled={isSeeding}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : 'Inisialisasi Database Demo'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login gagal')
        setIsLoading(false)
        return
      }

      if (data.mustChangePassword) {
        setMustChangePassword(true)
        setLoggedInUser(data.user)
        setIsLoading(false)
        return
      }

      setCurrentUser(data.user)
      showAlert(`Selamat datang, ${data.user.name}!`)
    } catch (err) {
      setError('Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: loggedInUser?.id, 
          currentPassword: password, 
          newPassword 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Gagal mengubah password')
        setIsLoading(false)
        return
      }

      showAlert('Password berhasil diubah! Silakan login kembali.')
      setMustChangePassword(false)
      setLoggedInUser(null)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Terjadi kesalahan saat mengubah password')
    } finally {
      setIsLoading(false)
    }
  }

  // Change password form
  if (mustChangePassword && loggedInUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100 p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Ganti Password</h1>
            <p className="text-slate-500 mt-2">
              Halo, <span className="font-semibold text-violet-600">{loggedInUser.name}</span>!
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Anda login dengan password default. Silakan buat password baru.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100 p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30">
            <PlayCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Pushakin Flows</h1>
          <div className="mt-2">
            <p className="text-sm font-semibold text-violet-600">Sistem Manajemen Produksi</p>
            <p className="text-xs text-slate-500">Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@pushakin.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
