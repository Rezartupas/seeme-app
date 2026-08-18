# Design Spec: Task Reschedule for Overdue Tasks

## Overview
Menyediakan fitur untuk menjadwalkan ulang (reschedule) tugas yang sudah lewat tempo (overdue) ke tanggal baru secara langsung dari kartu tugas.

## Data Layer (`TaskContext`)
- Tambahkan `rescheduleTask(id: string, newDate: string) => Promise<void>`
- Optimistic update `date = newDate` pada local state.
- Update `date` dan `updated_at` ke Supabase table `tasks`.

## UI Layer (`TaskCard`)
- Pada kartu tugas, sediakan tombol Reschedule (ikon `edit_calendar`).
- Popover interaktif neo-brutalist:
  - Tombol **Hari Ini**
  - Tombol **Besok**
  - Pemilih tanggal kustom `<input type="date">`
- Setelah memilih tanggal baru, kartu otomatis berpindah dari daftar "Terlewat" ke "Hari Ini" atau "Akan Datang".
