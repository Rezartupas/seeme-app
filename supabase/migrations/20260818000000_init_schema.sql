-- See Me Reminder: Production Schema & Policies

-- 1. Profiles table (sync with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  telegram_chat_id text,
  telegram_link_code text,
  telegram_link_code_expires_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#9d27b0',
  created_at timestamptz default now()
);

-- 3. Tasks table
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

-- 4. Task Categories Junction table (Many-to-Many)
create table if not exists public.task_categories (
  task_id uuid references public.tasks(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (task_id, category_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.task_categories enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Categories Policies
create policy "Users can view own categories" on public.categories
  for select using (auth.uid() = user_id);

create policy "Users can insert own categories" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update own categories" on public.categories
  for update using (auth.uid() = user_id);

create policy "Users can delete own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Tasks Policies
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Task Categories Policies
create policy "Users can view own task_categories" on public.task_categories
  for select using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_categories.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert own task_categories" on public.task_categories
  for insert with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_categories.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own task_categories" on public.task_categories
  for delete using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_categories.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- Function & Trigger to automatically create a profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  -- Create default categories for new user
  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Kerja', '#9d27b0'),
    (new.id, 'Pribadi', '#ff66cc'),
    (new.id, 'Kesehatan', '#00c853'),
    (new.id, 'Rapat', '#fecb00');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
