# Fitur Pertemanan SeeMe Reminder: List Teman, Kalender Jadwal Teman, Komentar & Reaksi

**Tanggal:** 2026-08-29
**Status:** Disetujui (desain terverifikasi oleh user, revisi 2)

## Ringkasan

Satu konsep sederhana: **halaman "Teman" (`/friends`)** berisi list teman + search untuk menemukan akun. Kirim friend request → target approve → keduanya saling jadi teman (dua arah / mutual). Klik teman → halaman `/friends/[id]` menampilkan **kalender jadwal teman** (hanya task yang ia share, mirip Google Calendar) → klik event → modal detail dengan **komentar** dan **reaksi emoji**. Notifikasi in-app memberi tahu user saat ada request/interaksi sosial.

Tidak ada halaman `/feed`, `/explore`, atau `/u/[username]` — sengaja disederhanakan.

## Keputusan Desain (dari brainstorming)

| Pertanyaan | Keputusan |
|---|---|
| Privasi aktivitas | **Share per-task** — toggle "Bagikan ke teman" di tiap task. Task tanpa share tetap 100% privat. |
| Model hubungan | **Friend request + approval**, setelah approve menjadi **mutual dua arah** (saling bisa lihat kalender & berinteraksi). Tidak bisa request diri sendiri / duplikat. |
| Reaksi | **6 emoji fixed set**: 👍 ❤️ 🔥 🎉 💪 👏. Satu user boleh pasang lebih dari satu jenis emoji per aktivitas. |
| Tampilan aktivitas teman | **Kalender penuh** (minggu/bulan, mirip Google Calendar), tanpa list feed. Klik event → modal detail. |
| Notifikasi | **In-app** (ikon lonceng + badge di topbar). Polling sederhana untuk MVP. |
| Menemukan user | **Search di halaman `/friends`** by name/username. |
| Arsitektur | **Tabel `activities` terpisah** — tabel `tasks` tetap 100% privat (zero perubahan RLS di tasks). |
| Reject/Unfriend | Delete row `friendships` (bisa request ulang nanti). |

## Arsitektur

Pola mengikuti codebase existing: **client-driven Supabase queries + RLS** (tanpa API routes CRUD, tanpa server actions). Tabel `tasks` yang sensitif **tidak disentuh sama sekali** — data yang di-share di-snapshot ke tabel `activities`, sehingga bug RLS di fitur sosial tidak akan pernah membocorkan task privat.

### Skema Database (migrasi baru)

**Perubahan pada tabel existing:**

- `profiles`: tambah kolom `name text`, `username text unique`, `avatar_url text`. Catatan: `name` sudah ditulis di tipe `Profile` (`src/lib/types.ts`) tapi belum ada di migrasi — migrasi ini me-resolve inkonsistensi tersebut.
- `tasks`: tambah kolom `is_shared boolean not null default false` — sumber kebenaran toggle share untuk UI; data publiknya lewat `activities`.

**Tabel baru:**

```sql
friendships (
  id uuid pk default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- cegah duplikat & request dua arah sekaligus (unique constraint tidak bisa
-- pakai expression, jadi pakai CREATE UNIQUE INDEX):
create unique index friendships_pair_unique
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

activities (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,  -- pemilik
  task_id uuid not null references tasks(id) on delete cascade,
  type text not null check (type in ('task_created','task_completed','task_shared')),
  title text not null,           -- snapshot judul task
  status text not null,          -- snapshot status ('pending'|'completed')
  start_time timestamptz,        -- untuk penempatan event di kalender
  end_time timestamptz,
  shared_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (task_id)               -- 1 task = 1 activity
)

comments (
  id uuid pk default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
)

reactions (
  id uuid pk default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (emoji in ('👍','❤️','🔥','🎉','💪','👏')),
  created_at timestamptz not null default now(),
  unique (activity_id, user_id, emoji)
)

notifications (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,  -- penerima
  actor_id uuid not null references profiles(id) on delete cascade, -- pelaku
  type text not null check (type in ('friend_request','friend_accepted','comment','reaction')),
  activity_id uuid references activities(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
)
```

Semua tabel baru: RLS enabled. Index: `friendships(requester_id)`, `friendships(addressee_id)`, `activities(user_id, start_time)`, `comments(activity_id)`, `reactions(activity_id)`, `notifications(user_id, is_read)`.

**View `public_profiles`** (untuk search & display, security_invoker):

```sql
create view public_profiles with (security_invoker = true) as
  select id, username, name, avatar_url from profiles;
```

Kolom sensitif (`telegram_chat_id`, `telegram_link_code`, `telegram_link_code_expires_at`, `email`) tidak pernah terekspos lewat view ini.

### RLS Policies

- `friendships`:
  - SELECT: `auth.uid() = requester_id OR auth.uid() = addressee_id`.
  - INSERT: `auth.uid() = requester_id` (status pending; check table mencegah self/duplikat).
  - UPDATE: `auth.uid() = addressee_id` (hanya addressee yang bisa approve).
  - DELETE: `auth.uid() = requester_id OR auth.uid() = addressee_id` (cancel request / reject / unfriend).
- `activities`:
  - SELECT: `user_id = auth.uid()` ATAU `EXISTS (SELECT 1 FROM friendships f WHERE f.status = 'accepted' AND auth.uid() IN (f.requester_id, f.addressee_id) AND f.requester_id <> f.addressee_id AND (f.requester_id = activities.user_id OR f.addressee_id = activities.user_id))` — yaitu: pemilik ATAU teman approved dua arah.
  - INSERT/UPDATE/DELETE: `user_id = auth.uid()`.
- `comments` / `reactions`:
  - SELECT: visibilitas activity (pemilik ATAU teman approved).
  - INSERT: requester adalah teman approved dari pemilik activity DAN `auth.uid() <> activity.user_id`.
  - DELETE: penulis (`auth.uid() = user_id`) ATAU pemilik activity (moderasi).
- `notifications`:
  - SELECT/UPDATE (is_read): `auth.uid() = user_id` (penerima).
  - INSERT: `auth.uid() = actor_id` (pelaku yang memicu).
- `profiles`: tetap own-rows-only untuk SELECT langsung; akses publik hanya lewat view `public_profiles`.
- `tasks`: **tidak ada perubahan policy** — tetap own-rows-only.

### Alur Data

1. **Search & request:** Di `/friends`, search query `public_profiles` (ilike name/username, exclude diri sendiri & yang sudah teman/pending — filter di client). Kartu hasil → tombol "Tambah Teman" → insert `friendships` (pending) → notif `friend_request` ke target.
2. **Request masuk:** Bagian atas `/friends` menampilkan request pending (dari `friendships` where addressee = me, status pending). Approve → update status accepted + notif `friend_accepted` ke requester. Reject → delete row.
3. **Request keluar (cancel):** Request yang aku kirim dan belum direspons bisa dicancel → delete row.
4. **List teman:** `friendships` status accepted yang melibatkan aku → teman = pihak lain. Klik → `/friends/[id]`.
5. **Kalender teman (`/friends/[id]`):** View kalender minggu/bulan men-query `activities` where `user_id = teman` — RLS otomatis mengizinkan karena sudah berteman. Event diberi warna/accent. Empty state jika teman belum share apa pun.
6. **Modal detail event:** Klik event → modal: judul, waktu, status, action bar reaksi (toggle on/off per emoji), thread komentar (list + input). Insert comment/reaction → notif `comment`/`reaction` ke pemilik activity (skip jika aksi ke diri sendiri).
7. **Share task:** Toggle "Bagikan ke teman" di task form (create/edit) → set `tasks.is_shared` + upsert `activities` (snapshot title, status, start/end). Toggle off → delete `activities` row (comments/reactions/notif terkait cascade terhapus). Complete task yang di-share → update activity `status`/`type`.
8. **Unfriend:** Dari list teman (atau kalender teman) → delete row friendships → event hilang dari kalender (RLS menolak), data interaksi tetap ada di sisi pemilik tapi tak terlihat lagi.
9. **Notifikasi:** Ikon lonceng di TopBar + badge jumlah belum dibaca; polling tiap ~30 detik. Panel daftar notifikasi; klik item → tandai terbaca + navigasi ke konteks terkait (request → `/friends`, comment/reaction → `/friends/[id]` activity terkait).

### Halaman & Komponen Baru

- `/friends` — list teman (status accepted), daftar request masuk (approve/reject), request keluar (cancel), search akun.
- `/friends/[id]` — kalender jadwal teman (minggu/bulan toggle) + modal detail aktivitas.
- Komponen: `ShareToggle` (task form), `FriendCard`, `FriendRequestItem`, `UserSearchResult`, `FriendCalendar`, `ActivityModal`, `ReactionBar`, `CommentThread`, `NotificationBell`.
- Navigasi: sidebar & bottom nav ditambah item **Teman**; TopBar ditambah `NotificationBell`.

### Tipe & Context

- `src/lib/types.ts`: tambah `Friendship`, `Activity`, `Comment`, `Reaction`, `Notification`, `PublicProfile`.
- Context baru `src/lib/social-context.tsx` (agar `task-context.tsx` tidak membesar): friendships (list/requests/search), notifikasi (badge + polling ~30 detik), query activities teman. 
- `task-context.tsx`: hanya ditambah sinkronisasi share → `activities` saat task create/update/delete.

### Error Handling

- Self-request / duplikat request: ditolak constraint DB → tangkap error, tampilkan pesan ramah.
- Unshare / hapus task: activity hilang dari kalender teman; comments/reactions cascade terhapus.
- Komentar kosong: validasi client, tidak dikirim.
- Notifikasi aksi sendiri: dicegah di client (skip insert jika `actor_id = user_id`).
- Task dihapus: activity terhapus cascade (task_id → tasks on delete cascade).
- Search tanpa hasil: empty state ramah.

### Testing

- Skrip SQL verifikasi RLS: non-teman TIDAK bisa SELECT activities; setelah approve bisa; user TIDAK bisa baca telegram_* via view; user TIDAK bisa insert notification atas nama orang lain; duplikat/self friendship ditolak.
- Uji manual di browser: kirim request → approve → masuk list dua arah → kalender teman tampil event yang di-share → comment/reaction → badge notif naik di kedua sisi → reject/cancel/unfriend membersihkan tampilan.

## Di Luar Cakupan (YAGNI)

- Realtime via Supabase Realtime (polling dulu; upgrade nanti jika perlu).
- Notifikasi Telegram untuk interaksi sosial.
- Profil publik halaman penuh (`/u/[username]`) — identitas cukup di kartu & modal.
- Edit/moderasi komentar lanjutan, DM, feed gabungan.
