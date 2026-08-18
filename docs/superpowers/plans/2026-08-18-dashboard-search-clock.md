# Dashboard Search & Realtime Clock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengaktifkan pencarian tugas real-time di beranda dan menambahkan widget jam WIB 24 jam & tanggal neo-brutalist.

**Architecture:** Modifikasi `src/app/page.tsx` dengan state `searchQuery`, filter dinamis pada kumpulan tugas, serta interval clock hook untuk waktu WIB.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript.

---

### Task 1: Pasang Live Clock & Realtime Search di Beranda

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Tambahkan state `currentTime` dan `mounted` dengan update interval setiap 1 detik**
- [ ] **Step 2: Format waktu 24 jam `HH:mm:ss WIB` dan tanggal `18 Agustus 2026`**
- [ ] **Step 3: Tambahkan input pencarian yang responsif di desktop & mobile**
- [ ] **Step 4: Sambungkan filter `searchQuery` ke daftar tugas Terlewat, Hari Ini, dan Akan Datang**

---

### Task 2: Verifikasi Build & Tampilan

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` untuk memastikan tidak ada error kompilasi**
