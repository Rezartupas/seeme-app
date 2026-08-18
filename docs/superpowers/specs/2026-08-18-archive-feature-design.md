# Design Spec: Archive Feature for Completed Tasks

## Overview
Implementasi halaman Arsip (`/archive`) untuk menampung seluruh tugas yang telah berstatus `completed`. Pengguna dapat meninjau riwayat tugas selesai, mengembalikan tugas ke status aktif (`pending`), atau menghapusnya.

## Changes

### 1. New Page: `src/app/archive/page.tsx`
- Mengambil daftar tugas dari `useTaskContext()`.
- Menyaring tugas dengan `status === 'completed'`, diurutkan dari yang paling baru diselesaikan (`updatedAt` / `date` descending).
- Menampilkan metrik total tugas selesai.
- Render kartu tugas menggunakan komponen `TaskCard` neo-brutalist yang sudah ada.
- State empty jika belum ada tugas selesai.

### 2. Navigation Sidebar (`src/components/navigation.tsx`)
- Ubah tombol `<button>Arsip</button>` menjadi `<Link href="/archive">Arsip</Link>` dengan indikator aktif jika rute saat ini `/archive`.

### 3. Settings Page (`src/app/settings/page.tsx`)
- Tambahkan pintasan cepat ke halaman Arsip untuk pengguna mobile/desktop.
