# Design Spec: Day View Date Stepper (< / >)

## Overview
Menambahkan tombol navigasi tanggal berupa panah chevron kiri (`<`) dan kanan (`>`) tepat di samping angka tanggal pada mode Harian (`viewMode === 'day'`) di halaman Kalender.

## Details
- Komponen: Di dalam container header tanggal mode harian.
- Elemen:
  - Tombol `<`: Mengurangi tanggal terpilih sebesar 1 hari (`prevDay`).
  - Angka Tanggal: Menampilkan tanggal terpilih (`selectedDate.getDate()`).
  - Tombol `>`: Menambah tanggal terpilih sebesar 1 hari (`nextDay`).
- Styling: Neo-brutalist border, hover highlight, active press effect.
