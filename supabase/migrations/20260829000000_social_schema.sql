-- 1. Extend profiles table
alter table public.profiles
  add column if not exists name text,
  add column if not exists username text unique,
  add column if not exists avatar_url text;

-- 2. Extend tasks table
alter table public.tasks
  add column if not exists is_shared boolean not null default false;

-- 3. friendships
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

-- 4. activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  type text not null check (type in ('task_created', 'task_completed', 'task_shared')),
  title text not null,
  status text not null check (status in ('pending', 'completed')),
  start_time timestamptz,
  end_time timestamptz,
  shared_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (task_id)
);
create index if not exists activities_user_time_idx on public.activities(user_id, start_time);

-- 5. comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_activity_idx on public.comments(activity_id);

-- 6. reactions
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '🔥', '🎉', '💪', '👏')),
  created_at timestamptz not null default now(),
  unique (activity_id, user_id, emoji)
);
create index if not exists reactions_activity_idx on public.reactions(activity_id);

-- 7. notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('friend_request', 'friend_accepted', 'comment', 'reaction')),
  activity_id uuid references public.activities(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_read_idx on public.notifications(user_id, is_read);

-- 8. public_profiles view (security_invoker = false ensures safe public discovery of id, username, name, avatar_url)
create or replace view public.public_profiles with (security_invoker = false) as
  select id, username, name, avatar_url from public.profiles;

-- 9. Enable RLS
alter table public.friendships enable row level security;
alter table public.activities enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

-- 10. RLS Policies: friendships
create policy "friendships_select" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id);

create policy "friendships_update" on public.friendships
  for update using (auth.uid() = addressee_id);

create policy "friendships_delete" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 11. RLS Policies: activities
create policy "activities_select" on public.activities
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = activities.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = activities.user_id)
        )
    )
  );

create policy "activities_insert" on public.activities
  for insert with check (user_id = auth.uid());

create policy "activities_update" on public.activities
  for update using (user_id = auth.uid());

create policy "activities_delete" on public.activities
  for delete using (user_id = auth.uid());

-- 12. RLS Policies: comments
create policy "comments_select" on public.comments
  for select using (
    exists (
      select 1 from public.activities a
      where a.id = comments.activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = a.user_id)
                or (f.addressee_id = auth.uid() and f.requester_id = a.user_id)
              )
          )
        )
    )
  );

create policy "comments_insert" on public.comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.activities a
      where a.id = comments.activity_id
        and exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = a.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = a.user_id)
            )
        )
    )
  );

create policy "comments_delete" on public.comments
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.activities a
      where a.id = comments.activity_id and a.user_id = auth.uid()
    )
  );

-- 13. RLS Policies: reactions (same visibility as comments)
create policy "reactions_select" on public.reactions
  for select using (
    exists (
      select 1 from public.activities a
      where a.id = reactions.activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = a.user_id)
                or (f.addressee_id = auth.uid() and f.requester_id = a.user_id)
              )
          )
        )
    )
  );

create policy "reactions_insert" on public.reactions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.activities a
      where a.id = reactions.activity_id
        and exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = a.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = a.user_id)
            )
        )
    )
  );

create policy "reactions_delete" on public.reactions
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.activities a
      where a.id = reactions.activity_id and a.user_id = auth.uid()
    )
  );

-- 14. RLS Policies: notifications
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() = actor_id);

create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications_delete" on public.notifications
  for delete using (auth.uid() = user_id);
