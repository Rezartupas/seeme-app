# Design Spec: Archive Batch Restore & Permanent Delete

## Overview
Menambahkan fungsionalitas multi-seleksi (batch selection) pada halaman Arsip (`/archive`), memungkinkan pengguna menandai satu atau lebih tugas untuk dipulihkan (`restore` -> kembali ke `pending`) atau dihapus permanen (`permanent delete`).

## UI & Interactions
1. **Toolbar Multi-Select (Bulk Action Bar):**
   - Checkbox "Pilih Semua" (Select All) dengan info jumlah yang terpilih (`N dipilih`).
   - Tombol **Pulihkan (Restore)**: Mengubah status tugas-tugas terpilih menjadi `pending`.
   - Tombol **Hapus Permanen**: Menampilkan dialog konfirmasi browser/modal sebelum menghapus row tugas dari database secara permanen.
2. **Item Card di Arsip:**
   - Menyediakan checkbox seleksi individual di sisi kiri kartu.
   - Status visual terpilih (background highlight subtle / border bold).
   - Tombol aksi cepat individual (Pulihkan & Hapus permanen) di tiap kartu.

## Data Layer (`TaskContext`)
- Tambahkan `restoreTasks(ids: string[])` untuk batch update `status = 'pending'`.
- Tambahkan `deleteTasks(ids: string[])` untuk batch delete dari Supabase table `tasks`.
