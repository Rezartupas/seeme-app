# Design Spec: Dashboard Task Search & Live Realtime Clock

## Overview
Implementasi pencarian tugas real-time pada beranda (`src/app/page.tsx`) dan penambahan widget jam WIB 24 jam serta tanggal real-time dengan gaya neo-brutalist.

## Requirements

### 1. Live Realtime Clock & Date
- Tampilkan jam format 24 jam (misal: `14:30:15 WIB`) dan tanggal format Indonesia (misal: `18 Agustus 2026`).
- Menggunakan hook `useEffect` + `setInterval` 1000ms untuk update real-time.
- Mencegah hydration mismatch antara server dan client.
- Styling: Kotak neo-brutalist dengan badge waktu berlatar belakang kontras.

### 2. Live Task Search
- State `searchQuery: string`.
- Input field di desktop dan mobile.
- Menyaring `overdue`, `today`, dan `upcoming` tasks secara otomatis.
- Menampilkan pesan saat tugas yang dicari tidak ditemukan.
