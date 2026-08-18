# Design Spec: Logo Integration for See Me Reminder

## Overview
Integrasi logo monokrom grid geometris brutalist ke dalam aplikasi See Me Reminder pada seluruh titik antarmuka utama: Sidebar desktop, TopBar mobile, Login page, dan Favicon browser.

## Assets
- Gambar logo disimpan di `public/seeme-logo.png`
- Versi icon / favicon disimpan di `public/seeme-icon.png` serta dikonfigurasi sebagai favicon di Next.js metadata.

## Layout Changes

### 1. Sidebar Desktop (`src/components/navigation.tsx`)
- Tambahkan elemen `Image` dari `next/image` di bagian header sidebar (`p-4 border-b-2 border-primary mb-4`).
- Tampilkan logo berukuran 44x44px berdampingan secara horizontal dengan teks 'SEE ME' dan subtitle 'Manifesto Produktivitas'.
- Style: Neo-brutalist border tipis atau flat clean dengan kontras tinggi sesuai tema.

### 2. TopBar Mobile (`src/components/navigation.tsx`)
- Tambahkan logo berukuran 28x28px di sebelah kiri judul 'SEE ME REMINDER'.
- Menggunakan flex alignment rata tengah dengan gap yang rapi.

### 3. Halaman Login (`src/app/login/page.tsx`)
- Tampilkan logo berukuran 64x64px di atas judul 'SEE ME' pada Brand Header halaman login.
- Centered layout dengan border neo-brutalist dan shadow konsisten.

### 4. Metadata & Favicon (`src/app/layout.tsx`)
- Perbarui metadata `icons` pada `RootLayout` mengarah ke `/seeme-icon.png` atau `/seeme-logo.png`.

## Non-goals
- Tidak merubah skema warna inti aplikasi.
- Tidak menambahkan animasi kompleks pada logo (tetap gaya brutalist minimalis statis).
