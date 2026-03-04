# Panduan Deploy ke Vercel

## Langkah 1: Persiapan Akun

### A. Buat Akun Vercel
1. Buka https://vercel.com/signup
2. Sign up dengan GitHub, GitLab, atau Bitbucket
3. Verifikasi email Anda

### B. Install Vercel CLI (Opsional)
```bash
npm install -g vercel
# atau
bun install -g vercel
```

---

## Langkah 2: Push ke Git Repository

### A. Buat Repository Baru di GitHub
1. Buka https://github.com/new
2. Nama: `pushakin-flows`
3. Pilih Private atau Public
4. Klik "Create repository"

### B. Push Kode
```bash
cd /home/z/my-project

# Inisialisasi git jika belum
git init

# Tambahkan remote
git remote add origin https://github.com/USERNAME/pushakin-flows.git

# Commit semua file
git add .
git commit -m "Initial commit - Pushakin Flows"

# Push ke GitHub
git push -u origin main
```

---

## Langkah 3: Buat Database PostgreSQL

### Opsi A: Vercel Postgres (Recommended)

1. Login ke Vercel Dashboard: https://vercel.com/dashboard
2. Pilih project → Storage → Create Database
3. Pilih **Postgres**
4. Beri nama: `pushakin-db`
5. Pilih region: Singapore (sin1) - terdekat dengan Indonesia
6. Klik "Create"
7. Setelah selesai, salin `DATABASE_URL` dari tab ".env.local"

### Opsi B: Supabase (Free Tier)

1. Buka https://supabase.com/
2. Sign up / Login
3. Create new project
4. Salin connection string dari Settings → Database
5. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### Opsi C: Neon (Serverless Postgres)

1. Buka https://neon.tech/
2. Sign up / Login
3. Create project
4. Salin connection string

---

## Langkah 4: Deploy ke Vercel

### Via Dashboard (Recommended)

1. Buka https://vercel.com/new
2. Import repository `pushakin-flows`
3. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `bun run build` (default)
   - **Output Directory**: `.next` (default)
4. Environment Variables:
   ```
   DATABASE_URL=postgres://... (dari Langkah 3)
   ```
5. Klik "Deploy"
6. Tunggu proses build selesai (±2-3 menit)

### Via CLI

```bash
cd /home/z/my-project

# Login ke Vercel
vercel login

# Deploy
vercel --prod

# Saat ditanya, masukkan:
# - Project name: pushakin-flows
# - Framework: Next.js
```

---

## Langkah 5: Update Schema untuk PostgreSQL

Setelah deploy pertama, update schema:

### A. Edit prisma/schema.prisma
Ubah baris 9:
```prisma
datasource db {
  provider  = "postgresql"  // Ubah dari "sqlite"
  url       = env("DATABASE_URL")
}
```

### B. Commit dan Push
```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

### C. Vercel akan otomatis redeploy

---

## Langkah 6: Inisialisasi Database

Setelah deploy sukses:

### A. Via Vercel CLI
```bash
# Set environment
vercel env pull .env.local

# Push schema ke database
bunx prisma db push

# Seed data awal
curl https://YOUR-APP.vercel.app/api/seed
```

### B. Atau via Vercel Dashboard
1. Buka project → Storage → Database
2. Klik "Query" tab
3. Jalankan SQL dari `prisma/schema.sql` (generate dengan `bunx prisma migrate dev --create-only`)

---

## Langkah 7: Login dan Test

1. Buka URL aplikasi: `https://pushakin-flows.vercel.app`
2. Klik "Inisialisasi Database Demo" jika belum ada data
3. Login dengan:
   - Email: `user1@pushakin.local`
   - Password: `pushakin123`
4. Ganti password admin

---

## Langkah 8: Konfigurasi Domain Custom (Opsional)

### A. Tambah Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Masukkan domain Anda: `pushakin.yourdomain.com`
3. Pilih "Add"

### B. Update DNS
Tambahkan CNAME record di domain registrar:
```
pushakin CNAME cname.vercel-dns.com
```

### C. SSL Otomatis
Vercel akan otomatis setup SSL dalam beberapa menit

---

## Environment Variables di Vercel

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://...` | Connection string PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | URL aplikasi (opsional) |

Untuk menambah:
1. Project → Settings → Environment Variables
2. Add Variable
3. Redeploy untuk apply

---

## Troubleshooting

### Build Error: Prisma Client
```
Error: Prisma Client could not be generated
```
**Solusi**: Pastikan `postinstall` script ada di package.json:
```json
"postinstall": "prisma generate"
```

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solusi**: 
- Cek DATABASE_URL benar
- Pastikan IP Vercel di-whitelist (untuk Supabase/Neon)
- Region database dan Vercel harus sama

### Prisma Schema Error
```
Error: SQLite does not support...
```
**Solusi**: Ubah provider ke `postgresql` di schema.prisma

---

## Checklist Deploy

- [ ] Repository GitHub sudah dibuat
- [ ] Kode sudah di-push ke GitHub
- [ ] Database PostgreSQL sudah dibuat (Vercel Postgres/Supabase/Neon)
- [ ] Project sudah di-deploy ke Vercel
- [ ] Environment variables sudah dikonfigurasi
- [ ] Schema sudah di-update ke PostgreSQL
- [ ] Database sudah di-seed
- [ ] Login berhasil dengan user demo
- [ ] Password admin sudah diganti
- [ ] Domain custom sudah dikonfigurasi (opsional)

---

## Backup & Maintenance

### Backup Database
Vercel Postgres: Otomatis backup harian
Supabase: Dashboard → Database → Backups

### Update Aplikasi
```bash
git add .
git commit -m "Update message"
git push
# Vercel akan auto-deploy
```

### Monitoring
- Vercel Dashboard → Project → Logs
- Vercel Dashboard → Project → Analytics
