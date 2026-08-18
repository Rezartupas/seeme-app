-- ================================================================
-- CARA SETUP CRON REMINDER DI SUPABASE (GRATIS, TIAP 1 MENIT)
-- ================================================================
-- 1. Buka Supabase Dashboard -> Database -> Extensions
-- 2. Pastikan extension "pg_cron" dan "pg_net" sudah AKTIF (Enabled)
-- 3. Buka menu SQL Editor, jalankan query berikut:
-- Ganti 'https://DOMAIN-VERCEL-ANDA.vercel.app' dengan URL domain Vercel Anda yang sebenarnya!
-- ================================================================

-- Aktifkan ekstensi jika belum aktif
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Buat schedule job tiap 1 menit untuk trigger reminder
-- Ganti YOUR_DOMAIN_HERE dengan domain production Anda
select cron.schedule(
  'seeme-reminders-job',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://seeme-app.vercel.app/api/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer seeme_cron_sec_8f93e1b04a9d7248c5e6211fa'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Catatan Perintah Bermanfaat:
-- Untuk melihat daftar cron yang berjalan:
-- select * from cron.job;

-- Untuk menghapus job cron jika ingin ganti domain:
-- select cron.unschedule('seeme-reminders-job');
