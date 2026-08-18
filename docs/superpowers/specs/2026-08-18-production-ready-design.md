# Spec Desain: Production Readiness See Me Reminder

## 1. Ringkasan
Dokumen ini mendefinisikan arsitektur backend, skema database, autentikasi, integrasi Telegram bot, dan cron scheduler pengingat untuk mengubah prototype frontend See Me Reminder menjadi aplikasi siap produksi.

## 2. Arsitektur Komponen
1. **Frontend Layer**: Next.js App Router (Client & Server Components) dengan Neo-Brutalist UI.
2. **Auth & Database Layer**: Supabase PostgreSQL + Supabase Auth (`@supabase/ssr`).
3. **Bot Webhook Layer**: Next.js Route Handler `/api/telegram/webhook` yang memproses command `/start <code>` dan `/done <task_id>`.
4. **Scheduler Layer**: Route Handler `/api/cron/reminders` dengan autentikasi Bearer token `CRON_SECRET`, membaca task berstatus `pending` yang jatuh tempo `reminder_at <= NOW()`, lalu mengirim notifikasi Telegram format rapi dan menandai `reminder_sent = true`.

## 3. Database Schema & RLS

### Tabel:
1. `profiles`:
   - `id` (uuid, primary key, references `auth.users.id`)
   - `email` (text)
   - `telegram_chat_id` (text, nullable)
   - `telegram_link_code` (text, nullable)
   - `telegram_link_code_expires_at` (timestamptz, nullable)
   - `created_at` (timestamptz default now())
2. `categories`:
   - `id` (uuid, primary key default gen_random_uuid())
   - `user_id` (uuid, references profiles.id on delete cascade)
   - `name` (text not null)
   - `color` (text not null)
   - `created_at` (timestamptz default now())
3. `tasks`:
   - `id` (uuid, primary key default gen_random_uuid())
   - `user_id` (uuid, references profiles.id on delete cascade)
   - `title` (text not null)
   - `description` (text, nullable)
   - `date` (date not null)
   - `start_time` (time, nullable)
   - `end_time` (time, nullable)
   - `is_important` (boolean default false)
   - `is_urgent` (boolean default false)
   - `status` (text default 'pending')
   - `reminder_at` (timestamptz, nullable)
   - `reminder_sent` (boolean default false)
   - `created_at` (timestamptz default now())
   - `updated_at` (timestamptz default now())
4. `task_categories`:
   - `task_id` (uuid references tasks.id on delete cascade)
   - `category_id` (uuid references categories.id on delete cascade)
   - Primary key: `(task_id, category_id)`

### RLS Policies:
- Seluruh tabel `profiles`, `categories`, `tasks`, `task_categories` memiliki Row Level Security aktif (`ENABLE ROW LEVEL SECURITY`).
- Operasi SELECT, INSERT, UPDATE, DELETE dibatasi ke `auth.uid() = user_id`.
- Service Role Key digunakan oleh webhook dan cron scheduler untuk akses multi-user.

## 4. Alur Integrasi Telegram Bot
1. User masuk ke halaman Pengaturan, klik "Hubungkan Telegram".
2. Frontend memanggil API `/api/telegram/generate-code` untuk generate kode 6 digit numerik acak dan menyimpannya di `profiles.telegram_link_code` dengan masa berlaku 10 menit.
3. User membuka bot `@seeme_robot` dan mengirim pesan `/start 123456`.
4. Telegram webhook (`/api/telegram/webhook`) memverifikasi kode, mencocokkan `user_id`, lalu menyimpan `chat_id` Telegram user ke `profiles.telegram_chat_id`.
5. Webhook membalas chat: "✅ Berhasil menghubungkan akun See Me Reminder!".
6. User dapat mengirim `/done <id_tugas>` untuk menyelesaikan tugas langsung dari Telegram.

## 5. Alur Scheduler Reminder
1. Cron job memanggil `GET/POST /api/cron/reminders` dengan header `Authorization: Bearer <CRON_SECRET>`.
2. Backend query tabel `tasks` dengan kriteria:
   - `status = 'pending'`
   - `reminder_sent = false`
   - `reminder_at IS NOT NULL AND reminder_at <= NOW()`
3. Mengambil `telegram_chat_id` dari profil user.
4. Mengirim pesan Telegram dengan format tebal, kategori, kuadran, dan link cepat.
5. Update `tasks.reminder_sent = true` dan `updated_at = NOW()`.

## 6. Halaman Autentikasi (Auth)
- Halaman Login & Registrasi dengan estetika Neo-Brutalist yang selaras (`/login`).
- Middleware Next.js untuk proteksi route dan refresh token session Supabase.
