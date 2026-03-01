'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore, STAGES } from '@/lib/store'
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Printer, 
  FileText,
  CheckCircle2,
  UserCircle,
  Loader2
} from 'lucide-react'
import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function ReportsView() {
  const { projects, users, selectedProjectId, setSelectedProjectId } = useAppStore()
  const completedProjects = projects.filter(p => p.currentStage === 5)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
  }

  const handleDownloadCSV = (project: typeof projects[0]) => {
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "LAPORAN KEGIATAN PROYEK PUSHAKIN\n\n"
    csvContent += `ID Proyek,${project.id}\n`
    csvContent += `Judul Kegiatan,${project.title}\n`
    csvContent += `Unit Pemohon,${project.requesterUnit}\n`
    csvContent += `Lokasi,${project.location}\n`
    csvContent += `Waktu Pelaksanaan,${formatDateTime(project.executionTime)}\n`
    csvContent += `PIC,${project.picName} (${project.picWhatsApp})\n\n`
    
    csvContent += "RINCIAN TUGAS DAN HASIL\n"
    csvContent += "Tahap,Peran,Petugas,Status,Tautan Hasil / Catatan\n"
    
    project.tasks.forEach(t => {
      const user = users.find(u => u.id === t.assignedTo)
      const userName = user ? user.name : 'Tidak ada'
      const notes = t.data?.link ? t.data.link : t.data?.notes ? t.data.notes : 'Selesai tanpa tautan'
      csvContent += `Tahap ${t.stage},${t.role},${userName},${t.status === 'completed' ? 'Selesai' : 'Belum'},"${notes}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Laporan_Kegiatan_${project.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGeneratePDF = async () => {
    if (!printRef.current) return
    
    setIsGeneratingPDF(true)
    
    try {
      // Create PDF with A4 size
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
      
      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }
      
      // Helper function to wrap text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const lines = pdf.splitTextToSize(text, maxWidth)
        lines.forEach((line: string, index: number) => {
          checkNewPage(lineHeight)
          pdf.text(line, x, y + (index * lineHeight))
        })
        return lines.length * lineHeight
      }
      
      const report = completedProjects.find(p => p.id === selectedProjectId)
      if (!report) return
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('LAPORAN KEGIATAN', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      pdf.text(report.title, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Ref ID: ${report.id}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      // Divider line
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // Info Grid
      pdf.setFontSize(10)
      const infoItems = [
        { label: 'Unit Pemohon', value: report.requesterUnit },
        { label: 'Waktu Selesai', value: formatDateTime(report.createdAt) },
        { label: 'Lokasi', value: report.location || '-' },
        { label: 'PIC', value: `${report.picName || '-'} (${report.picWhatsApp || '-'})` }
      ]
      
      for (let i = 0; i < infoItems.length; i += 2) {
        checkNewPage(15)
        
        // Left column
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text(infoItems[i].label.toUpperCase(), margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(infoItems[i].value, margin, yPosition + 5)
        
        // Right column
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
      
      // Divider
      yPosition += 5
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      
      // Description section
      checkNewPage(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('RINCIAN INSTRUKSI MANAGER', margin, yPosition)
      yPosition += 6
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const descHeight = addWrappedText(report.description, margin, yPosition, contentWidth, 5)
      yPosition += descHeight + 5
      
      // Activity Types & Output Needs
      if (report.activityTypes.length > 0 || report.outputNeeds.length > 0) {
        checkNewPage(10)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Jenis Kegiatan: ', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        const activities = report.activityTypes.join(', ')
        pdf.text(activities, margin + 30, yPosition)
        yPosition += 5
        
        pdf.setFont('helvetica', 'bold')
        pdf.text('Kebutuhan Output: ', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        const outputs = report.outputNeeds.join(', ')
        pdf.text(outputs, margin + 35, yPosition)
        yPosition += 10
      }
      
      // Divider
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      
      // Tasks section
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('REKAPITULASI TIM & BUKTI HASIL', margin, yPosition)
      yPosition += 8
      
      // Task items
      report.tasks.forEach((task, index) => {
        checkNewPage(35)
        
        const user = users.find(u => u.id === task.assignedTo)
        const userName = user ? user.name : 'Unknown'
        
        // Task box
        pdf.setDrawColor(200, 200, 200)
        pdf.setFillColor(249, 250, 251)
        pdf.roundedRect(margin, yPosition, contentWidth, 30, 2, 2, 'FD')
        
        const taskY = yPosition + 5
        
        // Tahap badge
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text(`Tahap ${task.stage}`, margin + 5, taskY)
        
        // Role
        pdf.setFontSize(10)
        pdf.text(task.role, margin + 25, taskY)
        
        // Status - use text instead of symbol for better compatibility
        pdf.setTextColor(34, 197, 94) // green-500
        pdf.setFontSize(8)
        pdf.text('TUNTAS', pageWidth - margin - 15, taskY)
        pdf.setTextColor(0, 0, 0) // reset to black
        
        // User
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text(`Dikerjakan oleh: ${userName}`, margin + 5, taskY + 6)
        
        // Bukti
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Bukti Serah Terima:', margin + 5, taskY + 12)
        pdf.setFont('helvetica', 'normal')
        
        const buktiText = task.data?.link || task.data?.notes || 'Tugas diselesaikan dan diunggah ke Drive'
        const buktiLines = pdf.splitTextToSize(buktiText, contentWidth - 10)
        pdf.setFontSize(8)
        buktiLines.slice(0, 3).forEach((line: string, i: number) => {
          pdf.text(line, margin + 5, taskY + 17 + (i * 4))
        })
        
        yPosition += 35
        
        // Add separator between tasks
        if (index < report.tasks.length - 1) {
          pdf.setDrawColor(230, 230, 230)
          pdf.line(margin + 10, yPosition - 2, pageWidth - margin - 10, yPosition - 2)
        }
      })
      
      // Footer
      yPosition += 15
      checkNewPage(15)
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Dokumen ini di-generate secara otomatis oleh Sistem Pushakin Flows.', pageWidth / 2, yPosition, { align: 'center' })
      pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, yPosition + 5, { align: 'center' })
      
      // Save PDF
      pdf.save(`Laporan_Kegiatan_${report.id}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
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
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownloadCSV(report)}
              className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Spreadsheet</span>
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/20"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Preview Area */}
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
              </h3>
              <div className="space-y-4">
                {report.tasks.map(task => {
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
