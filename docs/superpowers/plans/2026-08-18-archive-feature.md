# Archive Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementasi halaman Arsip (`/archive`) untuk menampilkan daftar tugas selesai, menghubungkan navigasi sidebar dan settings.

**Architecture:** Menggunakan `useTaskContext` untuk konsumsi data tasks (`status === 'completed'`), render via `TaskCard`, dan menyediakan link rute di `Sidebar` dan `SettingsPage`.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, TypeScript.

---

### Task 1: Buat Halaman Arsip (`src/app/archive/page.tsx`)

**Files:**
- Create: `src/app/archive/page.tsx`

- [ ] **Step 1: Buat komponen halaman `ArchivePage` dengan filter `status === 'completed'` dan list `TaskCard`**
- [ ] **Step 2: Tambahkan state kosong dan header statistik tugas selesai**

---

### Task 2: Hubungkan Navigasi Sidebar dan Halaman Pengaturan

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Ubah button Arsip di `src/components/navigation.tsx` menjadi `<Link href="/archive">`**
- [ ] **Step 2: Tambahkan shortcut Arsip di `src/app/settings/page.tsx`**

---

### Task 3: Verifikasi Build dan Integrasi

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` dan verifikasi route `/archive` terdaftar & bebas error**
