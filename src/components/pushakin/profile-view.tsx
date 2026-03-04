'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore, ROLES } from '@/lib/store'
import { 
  Save, 
  CheckCircle2, 
  UploadCloud 
} from 'lucide-react'
import { useState, useRef } from 'react'

export function ProfileView() {
  const { currentUser, setCurrentUser, updateUser, showAlert } = useAppStore()
  const [profileData, setProfileData] = useState(currentUser)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!profileData) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        setCurrentUser(profileData)
        updateUser(profileData)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        showAlert('Gagal menyimpan profil')
      }
    } catch {
      showAlert('Terjadi kesalahan')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        {/* Header with Avatar */}
        <CardHeader className="bg-stone-50 border-b border-stone-100 p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-24 w-24 border-4 border-white shadow-md group-hover:opacity-75 transition-opacity">
                <AvatarImage src={profileData.avatar || ''} alt={profileData.name} />
                <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-stone-900">{profileData.name}</h2>
              <p className="text-indigo-600 font-medium">{profileData.role}</p>
              <p className="text-sm text-stone-500 mt-1">{profileData.email}</p>
            </div>
          </div>
        </CardHeader>

        {/* Form */}
        <CardContent className="p-8">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {saveSuccess && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Profil berhasil diperbarui!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  required
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Peran (Role)</Label>
                <Select
                  value={profileData.role}
                  onValueChange={(value) => setProfileData({...profileData, role: value as typeof profileData.role})}
                  disabled={currentUser?.role !== 'Admin'}
                >
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">No. WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={profileData.whatsapp}
                  onChange={e => setProfileData({...profileData, whatsapp: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex justify-end">
              <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
