# Category Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memasang tombol hapus kategori aktif pada halaman Pengaturan dan Form Tugas Baru.

**Architecture:** Memanfaatkan method `deleteCategory(id)` dari `TaskContext` dan merender tombol interaktif pada badge kategori di `src/app/settings/page.tsx` dan `src/app/task/new/page.tsx`.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript.

---

### Task 1: Pasang Tombol Hapus Kategori di Halaman Pengaturan

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Panggil `deleteCategory` dari `useTaskContext()`**
- [ ] **Step 2: Tambahkan tombol hapus silang (`×` / delete icon) pada badge kategori dengan konfirmasi `window.confirm`**

---

### Task 2: Pasang Tombol Hapus Kategori di Form Tugas Baru

**Files:**
- Modify: `src/app/task/new/page.tsx`

- [ ] **Step 1: Ambil `deleteCategory` dari `useTaskContext()`**
- [ ] **Step 2: Tambahkan aksi hapus pada setiap pill kategori dengan `e.stopPropagation()` dan konfirmasi**

---

### Task 3: Verifikasi Build & Tes

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` untuk memverifikasi validitas tipe dan komponen**
