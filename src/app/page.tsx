'use client'

// Maintenance Mode Feature - Updated for production
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore, type User } from '@/lib/store'
import { LoginView } from '@/components/pushakin/login-view'
import { Sidebar } from '@/components/pushakin/sidebar'
import { Topbar } from '@/components/pushakin/topbar'
import { DashboardView } from '@/components/pushakin/dashboard-view'
import { CreateProjectView } from '@/components/pushakin/create-project-view'
import { ProjectDetailView } from '@/components/pushakin/project-detail-view'
import { OverviewView } from '@/components/pushakin/overview-view'
import { ReportsView } from '@/components/pushakin/reports-view'
import { UserManagementView } from '@/components/pushakin/user-management-view'
import { ProfileView } from '@/components/pushakin/profile-view'
import { SettingsView } from '@/components/pushakin/settings-view'
import { DialogModal } from '@/components/pushakin/dialog-modal'
import { PublicTrackerView } from '@/components/pushakin/public-tracker-view'
import { Settings, Wrench, Clock, AlertTriangle, Shield } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
        <p className="text-slate-600">Memuat Pushakin Flows...</p>
      </div>
    </div>
  )
}

interface MaintenanceData {
  maintenance: boolean
  message: string | null
}

function MaintenanceView({ message, onAdminLogin }: { message: string | null; onAdminLogin: () => void }) {
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login gagal')
        setIsLoading(false)
        return
      }

      if (data.user?.role !== 'Admin') {
        setError('Hanya Admin yang dapat mengakses saat maintenance')
        setIsLoading(false)
        return
      }

      localStorage.setItem('adminMaintenanceAccess', 'true')
      onAdminLogin()
    } catch (err) {
      console.error('Admin login error:', err)
      setError('Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Sedang Dalam Maintenance</h1>
          <p className="text-white/60 mb-4">{message || 'Pushakin Flows sedang diperbarui untuk meningkatkan layanan.'}</p>

          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3 text-white/80">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Estimasi: Beberapa menit</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Silakan coba beberapa saat lagi</span>
            </div>
          </div>

          <button onClick={() => setShowAdmin(!showAdmin)} className="text-white/40 hover:text-white/60 text-xs flex items-center gap-1 mx-auto mb-4">
            <Settings className="w-3 h-3" />
            <span>Akses Admin</span>
          </button>

          {showAdmin && (
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-violet-300 text-sm mb-2">
                <Shield className="w-4 h-4" />
                <span>Login Admin untuk Mengakses</span>
              </div>
              <input type="email" value={adminEmail} onChange={(e) => { setAdminEmail(e.target.value); setError('') }} placeholder="Email Admin" className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm" />
              <input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setError('') }} placeholder="Password" className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={handleAdminLogin} disabled={isLoading || !adminEmail || !adminPassword} className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-lg text-sm font-medium transition-colors">
                {isLoading ? 'Memproses...' : 'Login Admin'}
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-white/30 text-xs mt-6">Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { currentUser, activeView, setUsers, setProjects, setNotifications, setCurrentUser } = useAppStore()
  const searchParams = useSearchParams()
  const isPublicView = searchParams.get('public') === 'tracker'
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | undefined>()
  const [users, setUsersState] = useState<User[]>([])
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null)
  const [adminMaintenanceAccess, setAdminMaintenanceAccess] = useState(false)

  useEffect(() => {
    const hasAccess = localStorage.getItem('adminMaintenanceAccess') === 'true'
    setAdminMaintenanceAccess(hasAccess)
  }, [])

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance')
        if (res.ok) {
          const data = await res.json()
          setMaintenanceData(data)
        } else {
          setMaintenanceData({ maintenance: false, message: null })
        }
      } catch {
        setMaintenanceData({ maintenance: false, message: null })
      }
    }
    checkMaintenance()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsersState(usersData)
          setUsers(usersData)
        }
        const projectsRes = await fetch('/api/projects')
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData)
        }
        setIsLoading(false)
      } catch { setIsLoading(false) }
    }
    fetchData()
  }, [setUsers, setProjects])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser) {
        try { const res = await fetch(`/api/notifications?userId=${currentUser.id}`); if (res.ok) setNotifications(await res.json()) } catch {}
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [currentUser, setNotifications])

  const handleSeed = async () => {
    setIsSeeding(true); setSeedError(undefined)
    try {
      const res = await fetch('/api/seed')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSeedError(data.details || data.error || 'Terjadi kesalahan')
        return
      }
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) { const usersData = await usersRes.json(); setUsersState(usersData); setUsers(usersData) }
    } catch { setSeedError('Tidak dapat terhubung ke server.') }
    finally { setIsSeeding(false) }
  }
  const handleBackFromPublic = () => { window.location.href = window.location.pathname }
  const handleAdminLogin = () => { setAdminMaintenanceAccess(true); window.location.reload() }

  if (isPublicView) return <PublicTrackerView onBack={handleBackFromPublic} />
  if (isLoading || maintenanceData === null) return <LoadingSpinner />

  if (maintenanceData.maintenance) {
    if (currentUser?.role === 'Admin' || adminMaintenanceAccess) {
      // Admin can access
    } else {
      return <MaintenanceView message={maintenanceData.message} onAdminLogin={handleAdminLogin} />
    }
  }

  if (activeView === 'login' || !currentUser) {
    return <><LoginView onSeed={handleSeed} isSeeding={isSeeding} seedError={seedError} /><DialogModal /></>
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-violet-50 font-sans selection:bg-violet-200 overflow-hidden">
      {maintenanceData.maintenance && (currentUser?.role === 'Admin' || adminMaintenanceAccess) && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-amber-900 text-center py-2 text-sm font-medium z-50 flex items-center justify-center gap-2">
          <Wrench className="w-4 h-4" />
          <span>Mode Maintenance Aktif - Hanya Admin yang dapat mengakses</span>
        </div>
      )}
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden ${maintenanceData.maintenance ? 'mt-10' : ''}`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'overview' && <OverviewView />}
          {activeView === 'create' && <CreateProjectView />}
          {activeView === 'project_detail' && <ProjectDetailView />}
          {activeView === 'users' && <UserManagementView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
      <DialogModal />
    </div>
  )
}

export default function Home() {
  return <Suspense fallback={<LoadingSpinner />}><AppContent /></Suspense>
}
