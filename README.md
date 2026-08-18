<div align="center">
  <img src="public/seeme-logo.png" alt="See Me Reminder Logo" width="120" />
  <h1>SEE ME REMINDER</h1>
  <p><strong>Manifesto Produktivitas & Manajemen Tugas Berbasis Kalender & Matriks Eisenhower</strong></p>
  <p><em>Dibangun dengan desain Neo-Brutalist yang tegas, fungsional, dan tanpa basa-basi.</em></p>

  <p>
    <a href="#fitur-utama">Fitur Utama</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#built-with-opencode--gemini-flash">AI Powered</a> •
    <a href="#instalasi--menjalankan-aplikasi">Cara Menjalankan</a> •
    <a href="#variabel-lingkungan-env">Environment</a>
  </p>
</div>

---

## ⚡ Tentang See Me Reminder

**See Me Reminder** adalah aplikasi manajemen produktivitas harian yang menggabungkan kekuatan **Matriks Eisenhower (Penting vs Mendesak)**, **Kalender Interaktif (Harian, Mingguan, Bulanan)**, dan **Integrasi Notifikasi Telegram Bot**.

Dibuat dengan sentuhan visual **Neo-Brutalism**—garis tebal, kontras tajam, bayangan berkarakter, dan tipografi tegas—aplikasi ini dirancang agar pengguna dapat fokus mengeksekusi apa yang benar-benar bernilai tinggi.

---

## 🚀 Fitur Utama

- 📅 **Kalender Interaktif & Multi-View**
  - Mode **Bulanan**, **Mingguan**, dan **Harian** yang responsif di desktop maupun mobile.
  - Indikator dot kuadran warna-warni pada tanggal kalender.
  - Klik tanggal untuk melihat daftar tugas lengkap di bagian bawah kalender secara real-time.
  - Tombol stepper cepat (`<` dan `>`) pada mode harian.
- 🎯 **Matriks Eisenhower (4 Kuadran Produktivitas)**
  - *Kerjakan Sekarang* (Mendesak & Penting)
  - *Jadwalkan* (Penting, Tidak Mendesak)
  - *Delegasikan* (Mendesak, Tidak Penting)
  - *Evaluasi / Hapus* (Tidak Mendesak, Tidak Penting)
- 🗄️ **Arsip Tugas Lengkap (`/archive`)**
  - Ruang khusus untuk meninjau riwayat tugas yang telah selesai.
  - Multi-select (pilih beberapa / pilih semua), **Pulihkan massal (Restore)** kembali ke tugas aktif, atau **Hapus permanen**.
- 🏷️ **Kategori Kustom Dinamis**
  - Buat dan hapus kategori dengan palet warna pilihan sendiri secara fleksibel di form tugas maupun pengaturan.
- 🤖 **Integrasi Telegram Bot**
  - Hubungkan akun Telegram dengan kode OTP 6 digit sekali pakai untuk menerima jadwal dan pengingat tugas langsung ke ponsel Anda.
- 🔒 **Akses Aman & Multi-Device**
  - Autentikasi dan basis data terenkripsi berbasis Supabase.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/) & React 19
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) dengan pendekatan *Neo-Brutalist Architecture*
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL & Row Level Security)
- **Bot Engine:** Telegram Bot API
- **Font & Icon:** Google Font *Space Grotesk* & *Material Symbols Outlined*

---

## 🤖 Built with OpenCode & Gemini Flash

Aplikasi ini dikembangkan dan disempurnakan dengan bantuan **[OpenCode](https://github.com/opencode-ai)** menggunakan model **Google Gemini Flash**. 

Melalui kolaborasi AI-assisted engineering yang cepat, penataan alur modular, debugging sistematis, hingga implementasi antarmuka neo-brutalist responsif dapat diselesaikan secara presisi dan efisien.

---

## 💻 Instalasi & Menjalankan Aplikasi

### 1. Clone Repositori
```bash
git clone https://github.com/username/seeme-reminder.git
cd seeme-reminder/seeme-app
```

### 2. Pasang Dependencies
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (.env.local)
Buat file `.env.local` di direktori utama dan isi kredensial Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_telegram_bot_username
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
CRON_SECRET=your_cron_secret_token
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## 📄 Lisensi
Proyek ini dibuat untuk kebutuhan personal & produktivitas terbuka. Bebas dipelajari dan dikembangkan lebih lanjut.
