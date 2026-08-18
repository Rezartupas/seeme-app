# Design Spec: Mobile Responsive Calendar View (Month & Week)

## Overview
Meningkatkan keterbacaan kalender pada tampilan mobile (<md) untuk mode Bulanan dan Mingguan. Mengganti teks tugas yang terpotong/sangat kecil di dalam cell grid dengan indikator visual (dot warna kuadran/badge jumlah) dan menampilkan daftar detail tugas di bawah grid kalender saat tanggal dipilih.

## Desktop (>=md) vs Mobile (<md) Behavior

### 1. Mode Bulanan (`viewMode === 'month'`)
- **Desktop (`hidden md:block`)**: Grid 7 kolom penuh dengan judul tugas, styling neo-brutalist border, dan preview hingga 3 tugas per cell.
- **Mobile (`md:hidden`)**:
  - Cell grid berukuran proporsional (tinggi ~50-60px).
  - Tampilkan angka tanggal dan indikator baris dot/counter warna kuadran (Merah = Urgent, Kuning = Important, Biru = Delegate, Abu-abu = Low).
  - Status aktif (tanggal yang dipilih) disorot dengan border kontras & background berbeda.
  - Di bawah grid kalender: Bagian "Tugas pada [Tanggal Terpilih]" yang menampilkan seluruh tugas tanggal tersebut secara penuh menggunakan kartu tugas yang mudah dibaca.

### 2. Mode Mingguan (`viewMode === 'week'`)
- **Desktop (`hidden md:block`)**: Grid 7 kolom vertikal penuh dengan kartu-kartu tugas.
- **Mobile (`md:hidden`)**:
  - Baris horizontal 7 hari dalam minggu tersebut berbentuk tombol tab hari (Hari + Tanggal + Dot counter).
  - Klik hari mengubah tanggal aktif dan menampilkan daftar tugas hari tersebut di bawahnya secara detail.

### 3. Komponen Pendukung
- Gunakan `TaskCard` atau list detail tugas lengkap (checkbox, judul, deskripsi, waktu, kategori, prioritas).
