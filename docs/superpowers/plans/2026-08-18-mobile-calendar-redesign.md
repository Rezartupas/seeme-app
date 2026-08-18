# Mobile Calendar Responsive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyesuaikan tampilan kalender mobile untuk mode Bulanan dan Mingguan agar tugas terbaca jelas melalui dot indikator kuadran dan list tugas detail di bawah kalender.

**Architecture:** Modifikasi `src/app/calendar/page.tsx` untuk memisahkan view rendering mobile vs desktop:
- Di mobile: render grid ringkas dengan dot kuadran & highlight tanggal aktif.
- Di bawah grid: render daftar tugas tanggal aktif secara penuh.
- Di desktop: pertahankan grid multi-baris berukuran besar.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript.

---

### Task 1: Refactor Month & Week View di `src/app/calendar/page.tsx`

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Buat state `selectedDateStr` tersinkronisasi saat klik tanggal di mobile**
- [ ] **Step 2: Implementasikan Mobile Month View (grid compact + dot indicators)**
- [ ] **Step 3: Implementasikan Mobile Week View (tabs hari + dot counters)**
- [ ] **Step 4: Implementasikan detail list tugas tanggal terpilih di bawah kalender pada mobile view**

---

### Task 2: Verifikasi Build dan Pengujian Tampilan

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` dan verifikasi tidak ada error TypeScript/React**
