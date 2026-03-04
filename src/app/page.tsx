'use client'

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

function AppContent() {
  const {
    currentUser, activeView,
    setUsers, setProjects, setNotifications,
    setCurrentUser
  } = useAppStore()
  
  const searchParams = useSearchParams()
  const isPublicView = searchParams.get('public') === 'tracker'
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | undefined>()
  const [users, setUsersState] = useState<User[]>([])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsersState(usersData)
          setUsers(usersData)
        }

        // Fetch projects
        const projectsRes = await fetch('/api/projects')
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [setUsers, setProjects])

  // Fetch notifications when user logs in
  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser) {
        try {
          const res = await fetch(`/api/notifications?userId=${currentUser.id}`)
          if (res.ok) {
            const data = await res.json()
            setNotifications(data)
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error)
        }
      }
    }

    fetchNotifications()
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [currentUser, setNotifications])

  // Handle database seeding
  const handleSeed = async () => {
    setIsSeeding(true)
    setSeedError(undefined)
    try {
      const res = await fetch('/api/seed')
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        setSeedError(data.details || data.error || 'Terjadi kesalahan')
        return
      }
      
      // Refetch users
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsersState(usersData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Seed failed:', error)
      setSeedError('Tidak dapat terhubung ke server. Pastikan DATABASE_URL sudah dikonfigurasi.')
    } finally {
      setIsSeeding(false)
    }
  }

  // Clear params and go to app
  const handleBackFromPublic = () => {
    window.location.href = window.location.pathname
  }

  // Public share view - No authentication required
  if (isPublicView) {
    return <PublicTrackerView onBack={handleBackFromPublic} />
  }

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Login view
  if (activeView === 'login' || !currentUser) {
    return (
      <>
        <LoginView onSeed={handleSeed} isSeeding={isSeeding} seedError={seedError} />
        <DialogModal />
      </>
    )
  }

  // Main application
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-violet-50 font-sans selection:bg-violet-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar />
        
        {/* Main Content Area - Scrollable */}
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

      {/* Global Dialog */}
      <DialogModal />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppContent />
    </Suspense>
  )
}
