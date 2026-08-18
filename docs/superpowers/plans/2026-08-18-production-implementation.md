# See Me Reminder Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjadikan See Me Reminder aplikasi production-ready dengan Supabase PostgreSQL + Auth, Sinkronisasi CRUD nyata, Webhook Telegram Bot, dan Cron Scheduler Reminder.

**Architecture:** Next.js App Router dengan `@supabase/ssr` untuk client/server session handling, Route Handlers untuk Telegram webhook dan cron endpoints, serta migrasi SQL dengan Row Level Security (RLS) terisolasi per user.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres, Auth, RLS), Tailwind CSS v4, Telegram Bot API.

---

### Task 1: Supabase Database Migration & SQL Setup

**Files:**
- Create: `supabase/migrations/20260818000000_init_schema.sql`

- [ ] **Step 1: Tulis SQL Migration lengkap dengan RLS dan trigger user**

```sql
-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  telegram_chat_id text,
  telegram_link_code text,
  telegram_link_code_expires_at timestamptz,
  created_at timestamptz default now()
);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  start_time time,
  end_time time,
  is_important boolean default false,
  is_urgent boolean default false,
  status text default 'pending' check (status in ('pending', 'completed')),
  reminder_at timestamptz,
  reminder_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Task Categories junction table
create table if not exists public.task_categories (
  task_id uuid references public.tasks(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (task_id, category_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.task_categories enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Categories policies
create policy "Users can view own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can create own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can create own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Task categories policies
create policy "Users can view own task categories" on public.task_categories for select using (
  exists (select 1 from public.tasks where tasks.id = task_categories.task_id and tasks.user_id = auth.uid())
);
create policy "Users can manage own task categories" on public.task_categories for all using (
  exists (select 1 from public.tasks where tasks.id = task_categories.task_id and tasks.user_id = auth.uid())
);

-- Auto create profile on auth signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### Task 2: Supabase SSR SDK & Utilities

**Files:**
- Modify: `package.json` (install `@supabase/supabase-js` & `@supabase/ssr`)
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Install `@supabase/supabase-js` dan `@supabase/ssr`**
- [ ] **Step 2: Buat client helper untuk browser (`createBrowserClient`)**
- [ ] **Step 3: Buat server helper untuk Server Components & Route Handlers (`createServerClient`)**
- [ ] **Step 4: Buat admin helper dengan `SUPABASE_SERVICE_ROLE_KEY` untuk Webhook & Cron**
- [ ] **Step 5: Buat middleware Next.js untuk auto-refresh token session auth**

---

### Task 3: Halaman Autentikasi (Login / Register)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Bangun form Login & Registrasi neo-brutalist dengan toggle mode**
- [ ] **Step 2: Implementasi Server Action / Client Handler untuk Sign In & Sign Up email/password**
- [ ] **Step 3: Route handler callback auth untuk token exchange**

---

### Task 4: Sinkronisasi Supabase Real CRUD di TaskContext

**Files:**
- Modify: `src/lib/task-context.tsx`
- Modify: `src/components/navigation.tsx` (tampilkan status user + logout)
- Modify: `src/app/settings/page.tsx` (tampilkan email login aktual)

- [ ] **Step 1: Hubungkan `TaskContext` ke tabel Supabase (Fetch tasks & categories user saat login)**
- [ ] **Step 2: Implementasi `addTask`, `toggleTask`, `deleteTask`, `addCategory`, `deleteCategory` dengan Supabase mutations**
- [ ] **Step 3: Fallback data offline / optimistik saat koneksi lambat**

---

### Task 5: Telegram Bot Webhook & Penghubungan Akun

**Files:**
- Create: `src/app/api/telegram/generate-code/route.ts`
- Create: `src/app/api/telegram/webhook/route.ts`
- Create: `src/lib/telegram.ts`

- [ ] **Step 1: Buat utility `sendTelegramMessage` di `src/lib/telegram.ts`**
- [ ] **Step 2: Buat endpoint `/api/telegram/generate-code` untuk generate kode 6-digit valid 10 menit**
- [ ] **Step 3: Buat endpoint `/api/telegram/webhook` untuk handle command `/start <code>` dan `/done <task_id>`**

---

### Task 6: Cron Scheduler Reminder

**Files:**
- Create: `src/app/api/cron/reminders/route.ts`
- Create: `vercel.json` (konfigurasi vercel cron job tiap menit)

- [ ] **Step 1: Buat Route Handler `/api/cron/reminders` dengan verifikasi Bearer `CRON_SECRET`**
- [ ] **Step 2: Ambil task `pending`, `reminder_sent = false`, `reminder_at <= NOW()`**
- [ ] **Step 3: Kirim notifikasi Telegram format rapi ke `telegram_chat_id` masing-masing user**
- [ ] **Step 4: Update task menjadi `reminder_sent = true`**

---

### Task 7: Verifikasi Build & Testing

- [ ] **Step 1: Jalankan `npm run build` untuk memverifikasi tidak ada type error atau route failure**
- [ ] **Step 2: Test self-check endpoint Telegram & Cron**
