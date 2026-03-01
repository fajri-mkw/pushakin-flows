# Panduan Setup Pushakin Flows

## Langkah 1: Persiapan Database

### A. Reset Database (Untuk Penggunaan Baru)
```bash
cd /home/z/my-project
bunx prisma db push --force-reset
```

### B. Inisialisasi User Demo
Buka aplikasi di browser, klik "Inisialisasi Database Demo"

Atau via API:
```bash
curl http://localhost:3000/api/seed
```

---

## Langkah 2: Login Pertama Kali

### Default Credentials:
| Role | Email | Password |
|------|-------|----------|
| Admin | user1@pushakin.local | pushakin123 |
| Manager | user2@pushakin.local | pushakin123 |

### Langkah:
1. Buka browser → akses aplikasi
2. Login dengan akun Admin (user1@pushakin.local)
3. Anda akan diminta mengganti password default
4. Buat password baru (minimal 6 karakter)

---

## Langkah 3: Konfigurasi Google Drive (Wajib untuk Upload File)

### A. Buat Project Google Cloud
1. Buka https://console.cloud.google.com/
2. Buat project baru atau pilih yang ada
3. Aktifkan **Google Drive API**
   - Menu → APIs & Services → Library
   - Cari "Google Drive API" → Enable

### B. Buat Service Account
1. Menu → IAM & Admin → Service Accounts
2. Klik "Create Service Account"
3. Isi nama: "pushakin-flows"
4. Role: "Editor" (atau buat custom role)
5. Klik "Done"
6. Klik pada service account yang dibuat
7. Tab "Keys" → "Add Key" → "Create new key"
8. Pilih JSON → Download file

### C. Buat Shared Drive (Recommended)
1. Buka Google Drive
2. Klik "Shared Drives" → "New"
3. Buat dengan nama "Pushakin Flows Data"
4. Buka Shared Drive tersebut
5. Salin ID dari URL: `drive.google.com/drive/folders/[SHARED_DRIVE_ID]`

### D. Share Drive ke Service Account
1. Buka Shared Drive yang dibuat
2. Klik "Manage members"
3. Tambahkan email service account (dari JSON file)
4. Berikan akses "Contributor" atau "Content manager"

### E. Konfigurasi di Aplikasi
1. Login sebagai Admin
2. Buka menu "Pengaturan"
3. Upload file JSON Service Account Key
4. Masukkan Shared Drive ID
5. Aktifkan "Auto Create Folder"
6. Klik "Simpan"

---

## Langkah 4: Tambah User Baru

### Via Aplikasi:
1. Login sebagai Admin/Manager
2. Buka menu "Manajemen User"
3. Klik "Tambah User"
4. Isi data:
   - Nama lengkap
   - Email (akan digunakan untuk login)
   - Role (sesuai tugas)
   - WhatsApp (opsional)
5. Klik "Simpan"
6. User baru akan mendapat password default: `pushakin123`

### Role yang Tersedia:
- **Admin** - Akses penuh semua fitur
- **Manager** - Kelola proyek dan user
- **Reporter** - Input berita/liputan
- **Photographer & Audio** - Dokumentasi foto & audio
- **Videographer & Audio** - Dokumentasi video & audio
- **Editor (Media)** - Edit konten media
- **Editor (Web & Social Media)** - Edit untuk web & medsos
- **Graphic Designer** - Desain grafis
- **Streaming Operator** - Operasional streaming
- **Podcast Operator** - Operasional podcast
- **Reviewer** - Review konten sebelum publikasi
- **Publisher Web** - Publikasi ke website
- **Publisher Social Media** - Publikasi ke medsos

---

## Langkah 5: Buat Proyek Pertama

### Langkah:
1. Login sebagai Manager/Admin
2. Klik "Buat Proyek Baru" atau tombol "+"
3. Isi form:
   - **Judul Proyek**: Nama kegiatan
   - **Deskripsi**: Detail kegiatan
   - **Unit Pemohon**: SKPD/instansi yang mengajukan
   - **Lokasi**: Tempat kegiatan
   - **Waktu Pelaksanaan**: Jadwal
   - **PIC**: Penanggung jawab
   - **No. WhatsApp PIC**: Untuk koordinasi
   - **Jenis Kegiatan**: Centang yang sesuai
   - **Output yang Dibutuhkan**: Centang yang diperlukan
4. Klik "Buat Proyek"

### Otomatis Dilakukan:
- Folder di Google Drive dibuat (jika sudah dikonfigurasi)
- Tugas dibuat sesuai role
- Notifikasi dikirim ke petugas terkait

---

## Langkah 6: Workflow Proyek

### Tahapan:
1. **Produksi** (Tahap 1)
   - Reporter: Cover berita
   - Photographer: Dokumentasi foto
   - Videographer: Dokumentasi video

2. **Pasca Produksi** (Tahap 2)
   - Editor Media: Edit foto/video
   - Graphic Designer: Buat desain
   - Editor Web/Sosmed: Siapkan konten

3. **Review** (Tahap 3)
   - Reviewer: Cek kualitas konten
   - Manager: Approve/revisi

4. **Publikasi** (Tahap 4)
   - Publisher Web: Upload ke website
   - Publisher Social Media: Upload ke medsos

### Setiap Tugas:
1. Klik kartu tugas
2. Upload file ke Google Drive
3. Isi link hasil kerja
4. Tandai selesai (✓)

---

## Langkah 7: Tampilan Publik (LED Display)

### Cara Mengakses:
1. Tambahkan `?public=tracker` di URL
   Contoh: `https://yourdomain.com/?public=tracker`

### Untuk Layar LED:
1. Buka URL publik di browser
2. Tekan F11 untuk fullscreen
3. Pilih filter waktu (Hari Ini, Minggu Ini, dll)
4. Tampilan akan auto-scroll setiap 10 detik

### Bagikan ke Petugas:
1. Login sebagai Manager/Admin
2. Buka "Statistik & Progress"
3. Klik "Bagikan ke Publik"
4. Link otomatis tersalin, bagikan ke petugas

---

## Langkah 8: Backup & Maintenance

### Backup Database:
```bash
# Backup manual
cp /home/z/my-project/prisma/dev.db /backup/pushakin_$(date +%Y%m%d).db

# Atau setup cron job (backup harian jam 2 pagi)
0 2 * * * cp /home/z/my-project/prisma/dev.db /backup/pushakin_$(date +\%Y\%m\%d).db
```

### Update Aplikasi:
```bash
cd /home/z/my-project
git pull
bun install
bunx prisma generate
bun run db:push
# Restart service
```

---

## Troubleshooting

### Login Gagal
- Pastikan email dan password benar
- Password default: `pushakin123`
- Cek apakah database sudah di-seed

### Upload File Gagal
- Cek konfigurasi Google Drive di Pengaturan
- Pastikan Service Account valid
- Cek Shared Drive ID sudah benar
- Pastikan Service Account punya akses ke Shared Drive

### Tampilan Publik Tidak Muncul
- Pastikan ada proyek yang sudah dibuat
- Cek filter waktu yang dipilih
- Refresh halaman

---

## Kontak Support

Jika mengalami kendala:
1. Cek file log: `/home/z/my-project/dev.log`
2. Restart aplikasi
3. Hubungi administrator sistem
