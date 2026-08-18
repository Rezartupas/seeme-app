# Task Reschedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan tombol & popover penjadwalan ulang (reschedule) pada kartu tugas terlewat.

**Architecture:** Tambahkan `rescheduleTask(id: string, newDate: string)` di `TaskContext` dan pasang UI popover reschedule di `TaskCard`.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript.

---

### Task 1: Tambahkan `rescheduleTask` di `TaskContext`

**Files:**
- Modify: `src/lib/task-context.tsx`

- [ ] **Step 1: Definisikan `rescheduleTask: (id: string, newDate: string) => Promise<void>` di interface & provider**
- [ ] **Step 2: Lakukan optimistic update pada state `tasks` dan kirim update ke Supabase**

---

### Task 2: Pasang UI Reschedule di `TaskCard`

**Files:**
- Modify: `src/components/task-card.tsx`

- [ ] **Step 1: Buat state popover reschedule pada `TaskCard`**
- [ ] **Step 2: Sediakan tombol 'Hari Ini', 'Besok', dan pemilih tanggal kustom `<input type="date">`**
- [ ] **Step 3: Pastikan aksi menutup popover dan memperbarui posisi tugas**

---

### Task 3: Verifikasi Build & Pengujian

**Files:**
- Test/Build: `npm run build`

- [ ] **Step 1: Jalankan `npm run build` dan pastikan tidak ada error kompilasi**
