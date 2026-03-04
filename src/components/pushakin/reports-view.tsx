'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, STAGES } from '@/lib/store'
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Printer, 
  FileText,
  CheckCircle2,
  UserCircle,
  Loader2,
  Filter,
  Users
} from 'lucide-react'
import { useState, useRef, useMemo } from 'react'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function ReportsView() {
  const { projects, users, selectedProjectId, setSelectedProjectId, currentUser } = useAppStore()
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  
  const completedProjects = useMemo(() => {
    const completed = projects.filter(p => p.currentStage === 5)
    
    if (selectedUserId === 'all') {
      return completed
    }
    
    return completed.filter(project => 
      project.tasks.some(task => task.assignedTo === selectedUserId)
    )
  }, [projects, selectedUserId])

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
  }
  
  const formatDateShort = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', { dateStyle: 'medium' })
  }

  // Export all filtered projects to Excel
  const handleExportAllToExcel = () => {
    setIsExportingExcel(true)
    
    try {
      const workbook = XLSX.utils.book_new()
      
      // Sheet 1: Ringkasan
      const summaryData = [
        ['REKAP LAPORAN KEGIATAN PRODUKSI'],
        ['Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi'],
        [],
        ['Tanggal Export', new Date().toLocaleString('id-ID')],
        selectedUserId !== 'all' ? ['Filter Petugas', users.find(u => u.id === selectedUserId)?.name || 'Unknown'] : [],
        ['Total Proyek', completedProjects.length.toString()],
        [],
        ['RINGKASAN PROYEK'],
        ['No', 'ID Proyek', 'Judul', 'Unit Pemohon', 'Lokasi', 'Waktu Selesai', 'PIC', 'Jumlah Tugas']
      ]
      
      completedProjects.forEach((p, idx) => {
        const tasksCount = selectedUserId !== 'all' 
          ? p.tasks.filter(t => t.assignedTo === selectedUserId).length
          : p.tasks.length
        summaryData.push([
          (idx + 1).toString(),
          p.id,
          p.title,
          p.requesterUnit,
          p.location || '-',
          formatDateShort(p.createdAt),
          p.picName || '-',
          tasksCount.toString()
        ])
      })
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      
      // Set column widths
      summarySheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, 
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }
      ]
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
      
      // Sheet 2: Detail Tugas
      const detailData = [
        ['DETAIL TUGAS PER PROYEK'],
        [],
      ]
      
      completedProjects.forEach((project, pIdx) => {
        const tasksToExport = selectedUserId !== 'all' 
          ? project.tasks.filter(t => t.assignedTo === selectedUserId)
          : project.tasks
        
        detailData.push([`PROYEK ${pIdx + 1}: ${project.title}`])
        detailData.push(['ID', project.id])
        detailData.push(['Unit Pemohon', project.requesterUnit])
        detailData.push(['Lokasi', project.location || '-'])
        detailData.push(['Waktu Pelaksanaan', formatDateTime(project.executionTime)])
        detailData.push(['PIC', `${project.picName || '-'} (${project.picWhatsApp || '-'})`])
        detailData.push(['Deskripsi', project.description])
        detailData.push([])
        detailData.push(['No', 'Tahap', 'Peran', 'Petugas', 'Status', 'Tautan/Catatan'])
        
        tasksToExport.forEach((t, idx) => {
          const user = users.find(u => u.id === t.assignedTo)
          const userName = user ? user.name : 'Tidak ada'
          const notes = t.data?.link || t.data?.notes || 'Selesai tanpa tautan'
          detailData.push([
            (idx + 1).toString(),
            `Tahap ${t.stage}`,
            t.role,
            userName,
            t.status === 'completed' ? 'Selesai' : 'Pending',
            notes
          ])
        })
        detailData.push([])
      })
      
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
      detailSheet['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, 
        { wch: 12 }, { wch: 50 }
      ]
      
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Tugas')
      
      // Generate and download
      const fileName = selectedUserId !== 'all' 
        ? `Rekap_Laporan_${users.find(u => u.id === selectedUserId)?.name?.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
        : `Rekap_Laporan_Semua_Proyek.xlsx`
      
      XLSX.writeFile(workbook, fileName)
      
      toast.success("File Excel berhasil dibuat!")
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Gagal mengekspor ke Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Export single project to Excel
  const handleExportProjectToExcel = (project: typeof projects[0]) => {
    setIsExportingExcel(true)
    
    try {
      const tasksToExport = selectedUserId !== 'all' 
        ? project.tasks.filter(t => t.assignedTo === selectedUserId)
        : project.tasks
      
      const workbook = XLSX.utils.book_new()
      
      // Sheet 1: Informasi Proyek
      const infoData = [
        ['LAPORAN KEGIATAN PRODUKSI'],
        ['Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi'],
        [],
        ['INFORMASI PROYEK'],
        ['ID Proyek', project.id],
        ['Judul Kegiatan', project.title],
        ['Deskripsi', project.description],
        ['Unit Pemohon', project.requesterUnit],
        ['Lokasi', project.location || '-'],
        ['Waktu Pelaksanaan', formatDateTime(project.executionTime)],
        ['PIC', project.picName || '-'],
        ['No. WhatsApp PIC', project.picWhatsApp || '-'],
        ['Waktu Selesai', formatDateTime(project.createdAt)],
        [],
        ['JENIS KEGIATAN'],
      ]
      
      project.activityTypes.forEach(a => {
        infoData.push(['', a])
      })
      
      infoData.push([])
      infoData.push(['KEBUTUHAN OUTPUT'])
      project.outputNeeds.forEach(o => {
        infoData.push(['', o])
      })
      
      if (selectedUserId !== 'all') {
        infoData.push([])
        infoData.push(['FILTER PETUGAS', users.find(u => u.id === selectedUserId)?.name || 'Unknown'])
      }
      
      const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
      infoSheet['!cols'] = [{ wch: 20 }, { wch: 60 }]
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informasi Proyek')
      
      // Sheet 2: Rekapitulasi Tugas
      const taskData = [
        ['REKAPITULASI TIM & BUKTI HASIL'],
        [],
        ['No', 'Tahap', 'Peran', 'Petugas', 'Status', 'Tautan Hasil / Catatan']
      ]
      
      tasksToExport.forEach((t, idx) => {
        const user = users.find(u => u.id === t.assignedTo)
        const userName = user ? user.name : 'Tidak ada'
        const notes = t.data?.link || t.data?.notes || 'Selesai tanpa tautan'
        taskData.push([
          (idx + 1).toString(),
          `Tahap ${t.stage}`,
          t.role,
          userName,
          t.status === 'completed' ? 'Selesai' : 'Pending',
          notes
        ])
      })
      
      const taskSheet = XLSX.utils.aoa_to_sheet(taskData)
      taskSheet['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, 
        { wch: 12 }, { wch: 50 }
      ]
      XLSX.utils.book_append_sheet(workbook, taskSheet, 'Rekapitulasi Tugas')
      
      const fileName = `Laporan_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      toast.success("File Excel berhasil dibuat!")
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Gagal mengekspor ke Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Export all to PDF
  const handleExportAllToPDF = async () => {
    setIsGeneratingPDF(true)
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      let yPosition = margin
      
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }
      
      // Header
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('REKAP LAPORAN KEGIATAN', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Sistem Manajemen Produksi', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
      pdf.setFontSize(8)
      pdf.text('Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
      
      if (selectedUserId !== 'all') {
        const filteredUser = users.find(u => u.id === selectedUserId)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(124, 58, 237)
        pdf.text(`Filter: ${filteredUser?.name || 'Unknown'}`, margin, yPosition)
        pdf.setTextColor(0, 0, 0)
        yPosition += 5
      }
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Total Proyek: ${completedProjects.length}`, margin, yPosition)
      pdf.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin - 40, yPosition)
      yPosition += 8
      
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      for (let pIdx = 0; pIdx < completedProjects.length; pIdx++) {
        const project = completedProjects[pIdx]
        const tasksToShow = selectedUserId !== 'all' 
          ? project.tasks.filter(t => t.assignedTo === selectedUserId)
          : project.tasks
        
        checkNewPage(50)
        
        pdf.setFillColor(249, 250, 251)
        pdf.roundedRect(margin, yPosition, contentWidth, 25, 2, 2, 'F')
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.text(`${pIdx + 1}. ${project.title}`, margin + 5, yPosition + 6)
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.text(`ID: ${project.id} | Unit: ${project.requesterUnit}`, margin + 5, yPosition + 12)
        pdf.text(`PIC: ${project.picName || '-'} | Selesai: ${formatDateShort(project.createdAt)}`, margin + 5, yPosition + 17)
        pdf.text(`Lokasi: ${project.location || '-'}`, margin + 5, yPosition + 22)
        
        yPosition += 28
        
        pdf.setFillColor(124, 58, 237)
        pdf.rect(margin, yPosition, contentWidth, 6, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Tahap', margin + 3, yPosition + 4)
        pdf.text('Peran', margin + 20, yPosition + 4)
        pdf.text('Petugas', margin + 55, yPosition + 4)
        pdf.text('Status', margin + 95, yPosition + 4)
        pdf.text('Catatan', margin + 115, yPosition + 4)
        pdf.setTextColor(0, 0, 0)
        yPosition += 8
        
        tasksToShow.forEach((task, idx) => {
          checkNewPage(10)
          
          const user = users.find(u => u.id === task.assignedTo)
          const userName = user ? user.name : '-'
          const notes = (task.data?.link || task.data?.notes || '-')?.substring(0, 40)
          
          if (idx % 2 === 0) {
            pdf.setFillColor(249, 250, 251)
            pdf.rect(margin, yPosition, contentWidth, 7, 'F')
          }
          
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Tahap ${task.stage}`, margin + 3, yPosition + 5)
          pdf.text(task.role.substring(0, 20), margin + 20, yPosition + 5)
          pdf.text(userName.substring(0, 20), margin + 55, yPosition + 5)
          
          if (task.status === 'completed') {
            pdf.setTextColor(34, 197, 94)
            pdf.text('Selesai', margin + 95, yPosition + 5)
          } else {
            pdf.setTextColor(234, 179, 8)
            pdf.text('Pending', margin + 95, yPosition + 5)
          }
          pdf.setTextColor(0, 0, 0)
          
          pdf.text(notes, margin + 115, yPosition + 5)
          yPosition += 8
        })
        
        yPosition += 8
        
        if (pIdx < completedProjects.length - 1) {
          pdf.setDrawColor(200, 200, 200)
          pdf.setLineDashPattern([2, 2], 0)
          pdf.line(margin, yPosition, pageWidth - margin, yPosition)
          pdf.setLineDashPattern([], 0)
          yPosition += 8
        }
      }
      
      yPosition += 10
      checkNewPage(10)
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Dokumen ini di-generate secara otomatis oleh Sistem Pushakin Flows.', pageWidth / 2, yPosition, { align: 'center' })
      pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, yPosition + 4, { align: 'center' })
      
      const fileName = selectedUserId !== 'all' 
        ? `Rekap_Laporan_${users.find(u => u.id === selectedUserId)?.name?.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : `Rekap_Laporan_Semua_Proyek.pdf`
      pdf.save(fileName)
      
      toast.success("PDF berhasil dibuat!")
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error("Gagal membuat PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Export single project to PDF
  const handleExportProjectToPDF = async (project: typeof projects[0]) => {
    setIsGeneratingPDF(true)
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      let yPosition = margin
      
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }
      
      const tasksToShow = selectedUserId !== 'all' 
        ? project.tasks.filter(t => t.assignedTo === selectedUserId)
        : project.tasks
      
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('LAPORAN KEGIATAN', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Sistem Manajemen Produksi', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
      pdf.setFontSize(8)
      pdf.text('Tim Pusat Hubungan Masyarakat dan Keterbukaan Informasi', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(project.title, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 6
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Ref ID: ${project.id}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      if (selectedUserId !== 'all') {
        const filteredUser = users.find(u => u.id === selectedUserId)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(124, 58, 237)
        pdf.text(`Filter: ${filteredUser?.name || 'Unknown'}`, margin, yPosition)
        pdf.setTextColor(0, 0, 0)
        yPosition += 6
      }
      
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      pdf.setFontSize(10)
      const infoItems = [
        { label: 'Unit Pemohon', value: project.requesterUnit },
        { label: 'Waktu Selesai', value: formatDateTime(project.createdAt) },
        { label: 'Lokasi', value: project.location || '-' },
        { label: 'PIC', value: `${project.picName || '-'} (${project.picWhatsApp || '-'})` }
      ]
      
      for (let i = 0; i < infoItems.length; i += 2) {
        checkNewPage(15)
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text(infoItems[i].label.toUpperCase(), margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(infoItems[i].value, margin, yPosition + 5)
        
        if (infoItems[i + 1]) {
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8)
          pdf.text(infoItems[i + 1].label.toUpperCase(), pageWidth / 2, yPosition)
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(10)
          pdf.text(infoItems[i + 1].value, pageWidth / 2, yPosition + 5)
        }
        
        yPosition += 12
      }
      
      yPosition += 5
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      
      checkNewPage(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('RINCIAN INSTRUKSI MANAGER', margin, yPosition)
      yPosition += 6
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const lines = pdf.splitTextToSize(project.description, contentWidth)
      lines.forEach((line: string) => {
        checkNewPage(5)
        pdf.text(line, margin, yPosition)
        yPosition += 5
      })
      yPosition += 5
      
      if (project.activityTypes.length > 0) {
        checkNewPage(10)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Jenis Kegiatan: ', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(project.activityTypes.join(', '), margin + 30, yPosition)
        yPosition += 5
      }
      
      if (project.outputNeeds.length > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Kebutuhan Output: ', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(project.outputNeeds.join(', '), margin + 35, yPosition)
        yPosition += 10
      }
      
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('REKAPITULASI TIM & BUKTI HASIL', margin, yPosition)
      yPosition += 8
      
      pdf.setFillColor(124, 58, 237)
      pdf.rect(margin, yPosition, contentWidth, 6, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7)
      pdf.text('Tahap', margin + 3, yPosition + 4)
      pdf.text('Peran', margin + 20, yPosition + 4)
      pdf.text('Petugas', margin + 55, yPosition + 4)
      pdf.text('Status', margin + 95, yPosition + 4)
      pdf.text('Catatan', margin + 115, yPosition + 4)
      pdf.setTextColor(0, 0, 0)
      yPosition += 8
      
      tasksToShow.forEach((task, idx) => {
        checkNewPage(10)
        
        const user = users.find(u => u.id === task.assignedTo)
        const userName = user ? user.name : '-'
        const notes = (task.data?.link || task.data?.notes || '-')?.substring(0, 40)
        
        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(margin, yPosition, contentWidth, 7, 'F')
        }
        
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Tahap ${task.stage}`, margin + 3, yPosition + 5)
        pdf.text(task.role.substring(0, 20), margin + 20, yPosition + 5)
        pdf.text(userName.substring(0, 20), margin + 55, yPosition + 5)
        
        if (task.status === 'completed') {
          pdf.setTextColor(34, 197, 94)
          pdf.text('Selesai', margin + 95, yPosition + 5)
        } else {
          pdf.setTextColor(234, 179, 8)
          pdf.text('Pending', margin + 95, yPosition + 5)
        }
        pdf.setTextColor(0, 0, 0)
        
        pdf.text(notes, margin + 115, yPosition + 5)
        yPosition += 8
      })
      
      yPosition += 15
      checkNewPage(15)
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Dokumen ini di-generate secara otomatis oleh Sistem Pushakin Flows.', pageWidth / 2, yPosition, { align: 'center' })
      pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, yPosition + 5, { align: 'center' })
      
      pdf.save(`Laporan_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
      
      toast.success("PDF berhasil dibuat!")
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error("Gagal membuat PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Detail View
  if (selectedProjectId) {
    const report = completedProjects.find(p => p.id === selectedProjectId)
    if (!report) return null

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedProjectId(null)}
            className="gap-2 text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Laporan</span>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportProjectToExcel(report)}
              disabled={isExportingExcel}
              className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'Mengunduh...' : 'Excel'}</span>
            </Button>
            <Button
              onClick={() => handleExportProjectToPDF(report)}
              disabled={isGeneratingPDF}
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? 'Membuat...' : 'PDF'}</span>
            </Button>
          </div>
        </div>

        <Card ref={printRef}>
          <CardContent className="p-10">
            <div className="text-center mb-10 pb-6 border-b-2 border-stone-800">
              <h1 className="text-3xl font-bold text-stone-900 uppercase tracking-widest mb-2">
                Laporan Kegiatan
              </h1>
              <p className="text-lg text-stone-600">{report.title}</p>
              <div className="mt-4 inline-block bg-stone-100 px-4 py-1 rounded-full text-xs font-mono text-stone-600 font-bold border border-stone-200">
                Ref ID: {report.id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Unit Pemohon
                </p>
                <p className="font-semibold text-stone-800 text-lg">{report.requesterUnit}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Waktu Selesai Keseluruhan
                </p>
                <p className="font-semibold text-stone-800 text-lg">{formatDateTime(report.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Lokasi Pelaksanaan
                </p>
                <p className="font-semibold text-stone-800">{report.location || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Penanggung Jawab (PIC)
                </p>
                <p className="font-semibold text-stone-800">
                  {report.picName || '-'} ({report.picWhatsApp || '-'})
                </p>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">
                Rincian Instruksi Manager
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.activityTypes.map(k => (
                  <Badge key={k} variant="outline" className="bg-stone-100 text-stone-600">
                    {k}
                  </Badge>
                ))}
                {report.outputNeeds.map(o => (
                  <Badge key={o} variant="outline" className="bg-violet-50 text-violet-700">
                    {o}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">
                Rekapitulasi Tim & Bukti Hasil
                {selectedUserId !== 'all' && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    (Filtered: {users.find(u => u.id === selectedUserId)?.name})
                  </span>
                )}
              </h3>
              <div className="space-y-4">
                {(selectedUserId !== 'all' 
                  ? report.tasks.filter(t => t.assignedTo === selectedUserId)
                  : report.tasks
                ).map(task => {
                  const user = users.find(u => u.id === task.assignedTo)
                  return (
                    <div
                      key={task.id}
                      className="bg-stone-50 border border-stone-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-stone-200 text-stone-600 font-bold">
                            Tahap {task.stage}
                          </Badge>
                          <span className="font-bold text-stone-800">{task.role}</span>
                        </div>
                        <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>Tuntas</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-600 mb-3">
                        <UserCircle className="w-4 h-4 text-stone-400" />
                        <span>Dikerjakan oleh: <strong className="text-stone-800">{user ? user.name : 'Unknown'}</strong></span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-stone-200 text-sm">
                        <strong className="block text-xs uppercase tracking-wider text-stone-400 mb-1">
                          Bukti Serah Terima:
                        </strong>
                        {task.data?.link ? (
                          <a
                            href={task.data.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-600 underline break-all"
                          >
                            {task.data.link}
                          </a>
                        ) : task.data?.publishLinks && task.data.publishLinks.length > 0 ? (
                          <div className="space-y-1">
                            {task.data.publishLinks.map((pl, idx) => (
                              <div key={idx} className="text-violet-600 underline break-all">
                                {pl.url}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-700 italic">
                            {task.data?.notes || 'Tugas diselesaikan dan diunggah ke Drive tanpa tautan spesifik.'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-stone-200 text-center text-xs text-stone-400">
              Dokumen ini di-generate secara otomatis oleh Sistem Pushakin Flows.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List View
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-violet-100 to-purple-100 p-2 rounded-xl text-violet-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Laporan & Rekap Kegiatan</h2>
          </div>
          <p className="text-stone-500">
            Daftar arsip proyek yang telah selesai (Tahap 5) dan siap diunduh untuk kebutuhan pelaporan manajerial.
          </p>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter berdasarkan:</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[220px] bg-white">
                    <SelectValue placeholder="Pilih Petugas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Petugas</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedUserId !== 'all' && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                    {users.find(u => u.id === selectedUserId)?.name}
                  </Badge>
                  <span className="text-slate-500">
                    ({completedProjects.length} proyek)
                  </span>
                </div>
              )}
            </div>
            
            {/* Export All Buttons */}
            {completedProjects.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportAllToExcel}
                  disabled={isExportingExcel}
                  className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExportingExcel ? 'Mengunduh...' : 'Export All (Excel)'}</span>
                </Button>
                <Button
                  onClick={handleExportAllToPDF}
                  disabled={isGeneratingPDF}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span>Export All (PDF)</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {completedProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="pt-6">
            <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-800">Belum ada Laporan</h3>
            <p className="text-stone-500 mt-2">
              Laporan akan muncul otomatis ketika sebuah proyek telah menyelesaikan proses Publikasi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedProjects.map(project => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md hover:border-violet-300 transition-all group"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 gap-1 border border-violet-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Selesai</span>
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400">{project.id}</span>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-stone-500 mb-4 line-clamp-2">{project.description}</p>
                <Separator className="mb-4" />
                <div className="text-xs text-stone-500">
                  <span className="block mb-1">
                    Unit: <strong className="text-stone-700">{project.requesterUnit}</strong>
                  </span>
                  <span>Waktu: {formatDateTime(project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
