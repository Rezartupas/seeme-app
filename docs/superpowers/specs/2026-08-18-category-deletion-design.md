# Design Spec: Category Deletion in Settings & Task Form

## Overview
Menyediakan fitur penghapusan kategori aktif di halaman Pengaturan (`/settings`) dan form pembuatan tugas (`/task/new`).

## Changes

### 1. Settings Page (`src/app/settings/page.tsx`)
- Render setiap kategori aktif dengan tombol hapus (`×` / `delete`).
- Menambahkan dialog konfirmasi `window.confirm` untuk mencegah ketidaksengajaan.
- Menghubungkan ke `deleteCategory(id)` dari `useTaskContext()`.

### 2. New Task Page (`src/app/task/new/page.tsx`)
- Render tombol hapus kecil di samping nama kategori tanpa mengganggu fungsi toggle seleksi kategori untuk tugas.
- Menggunakan `e.stopPropagation()` agar klik tombol hapus tidak memicu pemilihan kategori.
