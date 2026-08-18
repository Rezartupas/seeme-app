# Archive Batch Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur multi-seleksi, pemulihan (restore) massal, dan penghapusan permanen pada halaman Arsip.

**Architecture:** Tambahkan helper `restoreTasks` dan `deleteTasks` di `TaskContext`, perbarui `src/app/archive/page.tsx` dengan UI checkbox seleksi, toolbar bulk actions, dan konfirmasi dialog.

**Tech Stack:** Next.js, React state (`selectedIds`), Supabase Client, Tailwind CSS.

---

### Task 1: Tambah Operasi Batch di TaskContext

**Files:**
- Modify: `src/lib/task-context.tsx`

- [ ] **Step 1: Tambahkan `restoreTasks: (ids: string[]) => Promise<void>` dan `deleteTasks: (ids: string[]) => Promise<void>` di interface & implementation TaskContext**
- [ ] **Step 2: Optimistic update state & Supabase query (`in` filter)**

---

### Task 2: Implementasikan UI Multi-Select & Batch Actions di Archive Page

**Files:**
- Modify: `src/app/archive/page.tsx`

- [ ] **Step 1: Tambahkan state `selectedIds: Set<string>`**
- [ ] **Step 2: Tambahkan bulk toolbar (Select All, Tombol Pulihkan, Tombol Hapus Permanen)**
- [ ] **Step 3: Render custom archive task item dengan checkbox seleksi, tombol restore cepat, dan tombol hapus cepat**

---

### Task 3: Verifikasi Build & Linting

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` dan verifikasi integritas kode**
