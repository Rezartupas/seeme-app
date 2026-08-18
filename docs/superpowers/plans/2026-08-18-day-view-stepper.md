# Day View Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan tombol stepper < dan > di samping angka tanggal pada mode Harian kalender.

**Architecture:** Modifikasi view mode 'day' di `src/app/calendar/page.tsx` dengan menambahkan tombol interaktif yang memodifikasi state `selectedDate` dan `currentDate` sebesar `±1 hari`.

**Tech Stack:** Next.js, React, Tailwind CSS.

---

### Task 1: Pasang Stepper Tanggal di Day View

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Tambahkan fungsi helper `stepDay(delta: number)`**
- [ ] **Step 2: Render tombol `<` di kiri angka tanggal dan `>` di kanan angka tanggal**
- [ ] **Step 3: Verifikasi build & fungsionalitas**
