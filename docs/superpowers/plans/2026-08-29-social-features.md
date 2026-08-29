# Social Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add friend list, friend request flow, shared-task calendar, and comment/reaction/notification system to SeeMe Reminder.

**Architecture:** Client-driven Supabase queries + RLS (no API routes for CRUD). Tasks table untouched — shared data snapshots into a new `activities` table. A new `social-context.tsx` handles all social state so `task-context.tsx` stays small.

**Tech Stack:** Next.js 16.3.1, React 19, Tailwind 4, Supabase JS v2, @supabase/ssr, Material Symbols Outlined icons, neo-brutalist CSS classes (`neo-border`, `neo-shadow`, etc.)

## Global Constraints

- No new npm dependencies — use only packages already in `package.json`.
- All Supabase queries are client-side (`createClient()` from `src/lib/supabase/client.ts`).
- RLS on every new table — no service-role key in client code.
- Tasks table policies: **zero changes**.
- Styling: match existing neo-brutalist system — `neo-border`, `neo-border-3`, `neo-shadow`, `neo-shadow-lg`, `active-press`, Material Symbols Outlined icons, Space Grotesk font, uppercase labels.
- Indonesian UI copy throughout (match existing page language).
- No TypeScript `any` — define explicit DB row interfaces inline (matching existing pattern in `task-context.tsx`).
- Each task ends with a `git commit`.

---

## File Map

**New files:**
- `supabase/migrations/20260829000000_social_schema.sql` — all new tables, indexes, RLS, view
- `src/lib/types.ts` — add `PublicProfile`, `Friendship`, `Activity`, `Comment`, `Reaction`, `Notification` (modify existing)
- `src/lib/social-context.tsx` — new context: friends, notifications, activity queries
- `src/components/share-toggle.tsx` — toggle "Bagikan ke teman" checkbox
- `src/components/friend-card.tsx` — friend list item card
- `src/components/friend-request-item.tsx` — incoming/outgoing request row
- `src/components/user-search-result.tsx` — search result row
- `src/components/notification-bell.tsx` — bell icon + badge + dropdown panel
- `src/components/friend-calendar.tsx` — week/month calendar for friend's activities
- `src/components/activity-modal.tsx` — modal: detail + reaction bar + comment thread
- `src/components/reaction-bar.tsx` — 6-emoji toggle bar
- `src/components/comment-thread.tsx` — comment list + input
- `src/app/friends/page.tsx` — `/friends` page
- `src/app/friends/[id]/page.tsx` — `/friends/[id]` friend calendar page

**Modified files:**
- `src/lib/task-context.tsx` — sync `activities` on task create/update/delete when `is_shared=true`; add `is_shared` to `Task` type usage
- `src/components/navigation.tsx` — add "Teman" nav item to `NAV_ITEMS`, add `NotificationBell` to `TopBar`, add "Teman" to `BottomNav`
- `src/components/app-shell.tsx` — wrap with `SocialProvider`
- `src/app/task/new/page.tsx` — add `ShareToggle` to task form

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260829000000_social_schema.sql`

**Interfaces:**
- Produces: tables `friendships`, `activities`, `comments`, `reactions`, `notifications`; view `public_profiles`; columns `profiles.name`, `profiles.username`, `profiles.avatar_url`, `tasks.is_shared`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260829000000_social_schema.sql

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

-- 8. public_profiles view (security_invoker = true keeps RLS active on underlying table)
create or replace view public.public_profiles with (security_invoker = true) as
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
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Paste the SQL above into Supabase → SQL Editor → Run. Verify no errors.

- [ ] **Step 3: Verify tables exist**

In Supabase → Table Editor, confirm these tables exist: `friendships`, `activities`, `comments`, `reactions`, `notifications`. Confirm `profiles` has `name`, `username`, `avatar_url`. Confirm `tasks` has `is_shared`.

- [ ] **Step 4: Verify RLS is on**

In SQL Editor:
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('friendships','activities','comments','reactions','notifications');
-- all rows should have rowsecurity = true
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260829000000_social_schema.sql
git commit -m "feat(db): migrasi skema sosial - friendships, activities, comments, reactions, notifications"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Consumes: DB schema from Task 1
- Produces:
  - `PublicProfile { id: string; username: string | null; name: string | null; avatar_url: string | null }`
  - `Friendship { id: string; requesterId: string; addresseeId: string; status: 'pending' | 'accepted'; createdAt: string; respondedAt: string | null }`
  - `Activity { id: string; userId: string; taskId: string; type: 'task_created' | 'task_completed' | 'task_shared'; title: string; status: 'pending' | 'completed'; startTime: string | null; endTime: string | null; sharedAt: string; createdAt: string }`
  - `Comment { id: string; activityId: string; userId: string; content: string; createdAt: string }`
  - `Reaction { id: string; activityId: string; userId: string; emoji: string; createdAt: string }`
  - `Notification { id: string; userId: string; actorId: string; type: 'friend_request' | 'friend_accepted' | 'comment' | 'reaction'; activityId: string | null; commentId: string | null; isRead: boolean; createdAt: string }`
  - `Task` updated: add `isShared: boolean`

- [ ] **Step 1: Update `src/lib/types.ts`**

Replace entire file content:

```typescript
export interface Profile {
  id: string;
  email: string | null;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  telegram_chat_id: string | null;
  telegram_link_code: string | null;
  telegram_link_code_expires_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isImportant: boolean;
  isUrgent: boolean;
  status: "pending" | "completed";
  reminderAt?: string; // ISO datetime
  reminderSent: boolean;
  categoryIds: string[];
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

export type QuadrantKey = "q1" | "q2" | "q3" | "q4";

export interface Quadrant {
  key: QuadrantKey;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
  tagRotation: string;
  tagPosition: string;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted";
  createdAt: string;
  respondedAt: string | null;
}

export interface Activity {
  id: string;
  userId: string;
  taskId: string;
  type: "task_created" | "task_completed" | "task_shared";
  title: string;
  status: "pending" | "completed";
  startTime: string | null;
  endTime: string | null;
  sharedAt: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  activityId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: "friend_request" | "friend_accepted" | "comment" | "reaction";
  activityId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Fix `task-context.tsx` mapping for `isShared`**

In `src/lib/task-context.tsx`, find the `mappedTasks` block and add `isShared`:

```typescript
// In the DbTask interface inside fetchUserData, add:
is_shared: boolean;

// In the mappedTasks map, add:
isShared: Boolean(t.is_shared),
```

Also in `addTask`, the `Omit` type will now include `isShared` — add it to the insert:

```typescript
// In addTask, inside the supabase insert object, add:
is_shared: t.isShared ?? false,
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/task-context.tsx
git commit -m "feat(types): tambah tipe sosial dan field isShared pada Task"
```

---

## Task 3: Social Context

**Files:**
- Create: `src/lib/social-context.tsx`

**Interfaces:**
- Consumes: `PublicProfile`, `Friendship`, `Activity`, `Comment`, `Reaction`, `Notification` from `src/lib/types.ts`; `createClient` from `src/lib/supabase/client.ts`
- Produces:
  - `SocialContextValue` with: `friends: Friendship[]`, `incomingRequests: Friendship[]`, `outgoingRequests: Friendship[]`, `notifications: Notification[]`, `unreadCount: number`, `searchUsers(q: string): Promise<PublicProfile[]>`, `sendFriendRequest(addresseeId: string): Promise<void>`, `acceptFriendRequest(friendshipId: string, requesterId: string): Promise<void>`, `rejectFriendRequest(friendshipId: string): Promise<void>`, `cancelFriendRequest(friendshipId: string): Promise<void>`, `unfriend(friendshipId: string): Promise<void>`, `getFriendActivities(friendId: string): Promise<Activity[]>`, `getActivityComments(activityId: string): Promise<Comment[]>`, `getActivityReactions(activityId: string): Promise<Reaction[]>`, `addComment(activityId: string, content: string, activityOwnerId: string): Promise<void>`, `toggleReaction(activityId: string, emoji: string, activityOwnerId: string): Promise<void>`, `markAllRead(): Promise<void>`, `refreshFriends(): Promise<void>`
  - `useSocialContext(): SocialContextValue`
  - `SocialProvider`

- [ ] **Step 1: Create `src/lib/social-context.tsx`**

```typescript
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Friendship,
  Activity,
  Comment,
  Reaction,
  Notification,
  PublicProfile,
} from "./types";
import { createClient } from "./supabase/client";

interface SocialContextValue {
  friends: Friendship[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
  notifications: Notification[];
  unreadCount: number;
  searchUsers: (q: string) => Promise<PublicProfile[]>;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string, requesterId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  cancelFriendRequest: (friendshipId: string) => Promise<void>;
  unfriend: (friendshipId: string) => Promise<void>;
  getFriendActivities: (friendId: string) => Promise<Activity[]>;
  getActivityComments: (activityId: string) => Promise<Comment[]>;
  getActivityReactions: (activityId: string) => Promise<Reaction[]>;
  addComment: (activityId: string, content: string, activityOwnerId: string) => Promise<void>;
  toggleReaction: (activityId: string, emoji: string, activityOwnerId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshFriends: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function useSocialContext() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocialContext must be inside SocialProvider");
  return ctx;
}

// DB row interfaces (snake_case from Supabase)
interface DbFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface DbActivity {
  id: string;
  user_id: string;
  task_id: string;
  type: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  shared_at: string;
  created_at: string;
}

interface DbComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface DbReaction {
  id: string;
  activity_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  activity_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
}

function mapFriendship(r: DbFriendship): Friendship {
  return {
    id: r.id,
    requesterId: r.requester_id,
    addresseeId: r.addressee_id,
    status: r.status as "pending" | "accepted",
    createdAt: r.created_at,
    respondedAt: r.responded_at,
  };
}

function mapActivity(r: DbActivity): Activity {
  return {
    id: r.id,
    userId: r.user_id,
    taskId: r.task_id,
    type: r.type as Activity["type"],
    title: r.title,
    status: r.status as "pending" | "completed",
    startTime: r.start_time,
    endTime: r.end_time,
    sharedAt: r.shared_at,
    createdAt: r.created_at,
  };
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFriends = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (error) { console.error("fetchFriends:", error); return; }

    const rows = (data as DbFriendship[]) || [];
    setFriends(rows.filter((r) => r.status === "accepted").map(mapFriendship));
    setIncomingRequests(
      rows
        .filter((r) => r.status === "pending" && r.addressee_id === currentUser.id)
        .map(mapFriendship)
    );
    setOutgoingRequests(
      rows
        .filter((r) => r.status === "pending" && r.requester_id === currentUser.id)
        .map(mapFriendship)
    );
  }, [supabase]);

  const fetchNotifications = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { console.error("fetchNotifications:", error); return; }

    const rows = (data as DbNotification[]) || [];
    setNotifications(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        actorId: r.actor_id,
        type: r.type as Notification["type"],
        activityId: r.activity_id,
        commentId: r.comment_id,
        isRead: r.is_read,
        createdAt: r.created_at,
      }))
    );
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u);
      if (!u) return;
      await fetchFriends(u);
      await fetchNotifications(u);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) { fetchFriends(u); fetchNotifications(u); }
    });

    // Poll notifications every 30 seconds
    pollingRef.current = setInterval(async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) fetchNotifications(u);
    }, 30000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchFriends, fetchNotifications, supabase]);

  const refreshFriends = useCallback(async () => {
    if (user) await fetchFriends(user);
  }, [user, fetchFriends]);

  const searchUsers = useCallback(async (q: string): Promise<PublicProfile[]> => {
    if (!q.trim() || !user) return [];
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, username, name, avatar_url")
      .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(20);

    if (error) { console.error("searchUsers:", error); return []; }
    return (data as PublicProfile[]) || [];
  }, [user, supabase]);

  const sendFriendRequest = useCallback(async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) throw error;
    // Notify addressee
    await supabase.from("notifications").insert({
      user_id: addresseeId,
      actor_id: user.id,
      type: "friend_request",
    });
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const acceptFriendRequest = useCallback(
    async (friendshipId: string, requesterId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", friendshipId);
      if (error) throw error;
      // Notify requester
      await supabase.from("notifications").insert({
        user_id: requesterId,
        actor_id: user.id,
        type: "friend_accepted",
      });
      await fetchFriends(user);
    },
    [user, supabase, fetchFriends]
  );

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const cancelFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const unfriend = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const getFriendActivities = useCallback(
    async (friendId: string): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", friendId)
        .order("start_time", { ascending: true });
      if (error) { console.error("getFriendActivities:", error); return []; }
      return ((data as DbActivity[]) || []).map(mapActivity);
    },
    [supabase]
  );

  const getActivityComments = useCallback(
    async (activityId: string): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });
      if (error) { console.error("getActivityComments:", error); return []; }
      return ((data as DbComment[]) || []).map((r) => ({
        id: r.id,
        activityId: r.activity_id,
        userId: r.user_id,
        content: r.content,
        createdAt: r.created_at,
      }));
    },
    [supabase]
  );

  const getActivityReactions = useCallback(
    async (activityId: string): Promise<Reaction[]> => {
      const { data, error } = await supabase
        .from("reactions")
        .select("*")
        .eq("activity_id", activityId);
      if (error) { console.error("getActivityReactions:", error); return []; }
      return ((data as DbReaction[]) || []).map((r) => ({
        id: r.id,
        activityId: r.activity_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
      }));
    },
    [supabase]
  );

  const addComment = useCallback(
    async (activityId: string, content: string, activityOwnerId: string) => {
      if (!user || !content.trim()) return;
      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({ activity_id: activityId, user_id: user.id, content: content.trim() })
        .select()
        .single();
      if (error) throw error;
      // Notify owner (skip if self)
      if (activityOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: activityOwnerId,
          actor_id: user.id,
          type: "comment",
          activity_id: activityId,
          comment_id: inserted.id,
        });
      }
    },
    [user, supabase]
  );

  const toggleReaction = useCallback(
    async (activityId: string, emoji: string, activityOwnerId: string) => {
      if (!user) return;
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("reactions").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("reactions")
          .insert({ activity_id: activityId, user_id: user.id, emoji });
        // Notify owner (skip if self)
        if (activityOwnerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: activityOwnerId,
            actor_id: user.id,
            type: "reaction",
            activity_id: activityId,
          });
        }
      }
    },
    [user, supabase]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [user, supabase]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SocialContext.Provider
      value={{
        friends,
        incomingRequests,
        outgoingRequests,
        notifications,
        unreadCount,
        searchUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        unfriend,
        getFriendActivities,
        getActivityComments,
        getActivityReactions,
        addComment,
        toggleReaction,
        markAllRead,
        refreshFriends,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/social-context.tsx
git commit -m "feat(social): tambah SocialContext dengan friendships, notifikasi, dan aktivitas"
```

---

## Task 4: Wire SocialProvider into AppShell

**Files:**
- Modify: `src/components/app-shell.tsx`

**Interfaces:**
- Consumes: `SocialProvider` from `src/lib/social-context.tsx`
- Produces: `SocialProvider` wraps all authenticated pages

- [ ] **Step 1: Update `src/components/app-shell.tsx`**

```typescript
"use client";

import { usePathname } from "next/navigation";
import { TaskProvider } from "@/lib/task-context";
import { SocialProvider } from "@/lib/social-context";
import { Sidebar, TopBar, BottomNav } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <TaskProvider>
      <SocialProvider>
        <TopBar />
        <Sidebar />
        <main className="pt-[60px] md:pt-0 md:pl-64 min-h-screen flex flex-col pb-24 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </SocialProvider>
    </TaskProvider>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/app-shell.tsx
git commit -m "feat(shell): tambah SocialProvider ke AppShell"
```

---

## Task 5: NotificationBell Component + TopBar & Sidebar Integration

**Files:**
- Create: `src/components/notification-bell.tsx`
- Modify: `src/components/navigation.tsx`

**Interfaces:**
- Consumes: `useSocialContext()` → `notifications`, `unreadCount`, `markAllRead`
- Produces: `<NotificationBell />` renders bell icon with badge, dropdown panel

- [ ] **Step 1: Create `src/components/notification-bell.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocialContext } from "@/lib/social-context";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useSocialContext();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) await markAllRead();
  };

  const handleNotifClick = (n: (typeof notifications)[0]) => {
    setOpen(false);
    if (n.type === "friend_request" || n.type === "friend_accepted") {
      router.push("/friends");
    } else if (n.activityId) {
      // Navigate to friend's calendar — we don't have the friend id here,
      // so navigate to /friends and let the user drill in.
      router.push("/friends");
    }
  };

  const typeLabel: Record<string, string> = {
    friend_request: "Permintaan pertemanan",
    friend_accepted: "Menerima pertemanan Anda",
    comment: "Berkomentar pada aktivitas",
    reaction: "Bereaksi pada aktivitas",
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1 text-primary hover:bg-secondary-container transition-transform active:translate-x-1 active:translate-y-1 flex items-center justify-center"
        title={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Tidak ada notifikasi baru"}
        aria-label="Notifikasi"
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-primary animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-surface border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b-2 border-primary flex justify-between items-center">
            <span className="text-[14px] font-bold uppercase tracking-[0.05em]">Notifikasi</span>
            <button
              onClick={() => setOpen(false)}
              className="material-symbols-outlined text-[18px] hover:text-error"
            >
              close
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-[13px] text-on-surface-variant text-center">
              Belum ada notifikasi
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-3 py-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors ${
                  !n.isRead ? "bg-secondary-container" : ""
                }`}
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.03em]">
                  {typeLabel[n.type] ?? n.type}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/navigation.tsx`**

Add "Teman" to `NAV_ITEMS`:

```typescript
const NAV_ITEMS = [
  { href: "/", icon: "dashboard", label: "Beranda" },
  { href: "/calendar", icon: "calendar_month", label: "Kalender" },
  { href: "/matrix", icon: "grid_view", label: "Matriks" },
  { href: "/friends", icon: "group", label: "Teman" },
  { href: "/task/new", icon: "add_box", label: "Tugas" },
];
```

Replace the existing `TopBar` export with one that includes `NotificationBell`. Add import at top of file:

```typescript
import { NotificationBell } from "./notification-bell";
```

In `TopBar`, remove the existing bell `<Link>` block and replace with `<NotificationBell />`:

```typescript
export function TopBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[16px] h-[52px] bg-surface border-b-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2">
        <Image
          src="/seeme-logo.png"
          alt="See Me Logo"
          width={28}
          height={28}
          className="w-7 h-7 object-contain border border-primary shrink-0"
          priority
        />
        <div className="text-[20px] leading-[24px] font-bold uppercase tracking-tight text-primary">
          SEE ME REMINDER
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <NotificationBell />
        <Link href="/settings">
          <span className="material-symbols-outlined text-primary hover:bg-secondary-container transition-transform active:translate-x-1 active:translate-y-1 p-1 cursor-pointer">
            settings
          </span>
        </Link>
      </div>
    </header>
  );
}
```

Also add "Teman" item to Sidebar's nav list — it already maps `NAV_ITEMS`, so it picks up automatically. Verify Sidebar renders the "Teman Baru" label correctly — in Sidebar the label transform is `item.label === "Tugas" ? "Tugas Baru" : item.label`, which is fine for "Teman".

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Start dev server and verify bell appears in mobile TopBar, "Teman" appears in nav**

```bash
npm run dev
```

Open browser → confirm no console errors, notification bell visible in TopBar, "Teman" nav item present.

- [ ] **Step 5: Commit**

```bash
git add src/components/notification-bell.tsx src/components/navigation.tsx
git commit -m "feat(nav): tambah NotificationBell dan item navigasi Teman"
```

---

## Task 6: ShareToggle Component + Task Form Integration

**Files:**
- Create: `src/components/share-toggle.tsx`
- Modify: `src/app/task/new/page.tsx`
- Modify: `src/lib/task-context.tsx` — sync activities on create/update/delete

**Interfaces:**
- Consumes: `Task.isShared`; `useSocialContext()` not needed here — `task-context` handles sync directly via supabase client
- Produces: `<ShareToggle checked value onChange />` checkbox + label

- [ ] **Step 1: Create `src/components/share-toggle.tsx`**

```typescript
"use client";

interface ShareToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ShareToggle({ checked, onChange }: ShareToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        className={`w-10 h-6 border-2 border-primary flex items-center transition-colors ${
          checked ? "bg-secondary-container" : "bg-surface-container-low"
        }`}
      >
        <div
          className={`w-4 h-4 border-2 border-primary transition-transform mx-0.5 ${
            checked ? "translate-x-4 bg-primary" : "bg-surface"
          }`}
        />
      </div>
      <span className="text-[14px] font-bold uppercase tracking-[0.05em] flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px]">group</span>
        Bagikan ke teman
      </span>
    </label>
  );
}
```

- [ ] **Step 2: Add `ShareToggle` to `src/app/task/new/page.tsx`**

Add import at top:
```typescript
import { ShareToggle } from "@/components/share-toggle";
```

Add state:
```typescript
const [isShared, setIsShared] = useState(false);
```

In `handleSubmit`, add `isShared` to `addTask` call:
```typescript
await addTask({
  title: title.trim(),
  description: description.trim() || undefined,
  date,
  startTime: startTime || undefined,
  endTime: endTime || undefined,
  reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
  isUrgent,
  isImportant,
  status: "pending",
  categoryIds: selectedCats,
  isShared,
});
```

Add `<ShareToggle>` inside the form, after the category section and before the submit button:
```typescript
<div className="border-t-2 border-primary pt-6">
  <ShareToggle checked={isShared} onChange={setIsShared} />
  <p className="text-[12px] text-on-surface-variant mt-2 uppercase tracking-[0.03em]">
    Teman yang sudah terhubung bisa melihat tugas ini di kalender mereka
  </p>
</div>
```

- [ ] **Step 3: Sync activities in `task-context.tsx`**

In `addTask`, after the category junctions insert block, add activity sync:

```typescript
// After category junctions insert:
if (t.isShared) {
  const startIso = t.date && t.startTime
    ? new Date(`${t.date}T${t.startTime}`).toISOString()
    : null;
  const endIso = t.date && t.endTime
    ? new Date(`${t.date}T${t.endTime}`).toISOString()
    : null;
  await supabase.from("activities").upsert({
    user_id: user.id,
    task_id: newTask.id,
    type: "task_shared",
    title: t.title,
    status: t.status,
    start_time: startIso,
    end_time: endIso,
  }, { onConflict: "task_id" });
}
```

In `toggleTask`, after the status update, add activity sync. Replace the try block content with:

```typescript
try {
  const { error } = await supabase
    .from("tasks")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  // Sync activity snapshot if task is shared
  const { data: actRow } = await supabase
    .from("activities")
    .select("id")
    .eq("task_id", id)
    .maybeSingle();
  if (actRow) {
    await supabase
      .from("activities")
      .update({
        status: nextStatus,
        type: nextStatus === "completed" ? "task_completed" : "task_shared",
      })
      .eq("task_id", id);
  }
} catch (err) {
  console.error("Error toggling task status:", err);
  await fetchUserData();
}
```

In `deleteTask`, activity is cascade-deleted by DB (task_id references tasks on delete cascade), so no extra code needed.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/share-toggle.tsx src/app/task/new/page.tsx src/lib/task-context.tsx
git commit -m "feat(task): tambah ShareToggle dan sinkronisasi aktivitas saat share/complete"
```

---

## Task 7: Friends Page (`/friends`)

**Files:**
- Create: `src/app/friends/page.tsx`
- Create: `src/components/friend-card.tsx`
- Create: `src/components/friend-request-item.tsx`
- Create: `src/components/user-search-result.tsx`

**Interfaces:**
- Consumes: `useSocialContext()` → all friend/request/search functions; `Friendship`, `PublicProfile` types
- Produces: `/friends` page with sections: incoming requests, outgoing requests, friend list, search

- [ ] **Step 1: Create `src/components/friend-card.tsx`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { Friendship } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface FriendCardProps {
  friendship: Friendship;
  currentUserId: string;
}

export function FriendCard({ friendship, currentUserId }: FriendCardProps) {
  const { unfriend } = useSocialContext();
  const router = useRouter();
  const friendId =
    friendship.requesterId === currentUserId
      ? friendship.addresseeId
      : friendship.requesterId;

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <button
        onClick={() => router.push(`/friends/${friendId}`)}
        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
      >
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <span className="text-[14px] font-bold uppercase tracking-[0.04em] truncate">
          {friendId.slice(0, 8)}…
        </span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(`/friends/${friendId}`)}
          className="p-1.5 border-2 border-primary bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          title="Lihat kalender"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
        </button>
        <button
          onClick={() => unfriend(friendship.id)}
          className="p-1.5 border-2 border-primary bg-error-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          title="Hapus teman"
        >
          <span className="material-symbols-outlined text-[18px] text-error">person_remove</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/friend-request-item.tsx`**

```typescript
"use client";

import { Friendship } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface FriendRequestItemProps {
  friendship: Friendship;
  direction: "incoming" | "outgoing";
}

export function FriendRequestItem({ friendship, direction }: FriendRequestItemProps) {
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } = useSocialContext();

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[0.04em] truncate">
            {direction === "incoming" ? friendship.requesterId.slice(0, 8) : friendship.addresseeId.slice(0, 8)}…
          </div>
          <div className="text-[11px] text-on-surface-variant uppercase tracking-[0.03em]">
            {direction === "incoming" ? "Ingin berteman dengan Anda" : "Permintaan dikirim"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        {direction === "incoming" ? (
          <>
            <button
              onClick={() => acceptFriendRequest(friendship.id, friendship.requesterId)}
              className="px-3 py-1.5 border-2 border-primary bg-category-green text-on-primary text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Terima
            </button>
            <button
              onClick={() => rejectFriendRequest(friendship.id)}
              className="px-3 py-1.5 border-2 border-primary bg-error-container text-error text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Tolak
            </button>
          </>
        ) : (
          <button
            onClick={() => cancelFriendRequest(friendship.id)}
            className="px-3 py-1.5 border-2 border-primary bg-surface text-on-surface text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/user-search-result.tsx`**

```typescript
"use client";

import { useState } from "react";
import { PublicProfile } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface UserSearchResultProps {
  profile: PublicProfile;
  existingFriendshipId?: string;
  isPending?: boolean;
}

export function UserSearchResult({ profile, existingFriendshipId, isPending }: UserSearchResultProps) {
  const { sendFriendRequest, cancelFriendRequest } = useSocialContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendFriendRequest(profile.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setError("Permintaan sudah dikirim sebelumnya");
      } else {
        setError("Gagal mengirim permintaan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingFriendshipId) return;
    setLoading(true);
    try {
      await cancelFriendRequest(existingFriendshipId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <div>
          <div className="text-[14px] font-bold uppercase tracking-[0.04em] truncate">
            {profile.name ?? profile.username ?? profile.id.slice(0, 8)}
          </div>
          {profile.username && (
            <div className="text-[11px] text-on-surface-variant">@{profile.username}</div>
          )}
        </div>
      </div>
      <div className="ml-2">
        {error && (
          <div className="text-[11px] text-error font-bold mb-1">{error}</div>
        )}
        {isPending ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-primary bg-surface text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
          >
            Batalkan
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-primary bg-secondary-container text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Tambah
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/friends/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useSocialContext } from "@/lib/social-context";
import { useTaskContext } from "@/lib/task-context";
import { PublicProfile } from "@/lib/types";
import { FriendCard } from "@/components/friend-card";
import { FriendRequestItem } from "@/components/friend-request-item";
import { UserSearchResult } from "@/components/user-search-result";

export default function FriendsPage() {
  const { user } = useTaskContext();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchUsers,
  } = useSocialContext();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  // Build lookup sets for existing relationships
  const existingIds = new Set([
    ...friends.map((f) =>
      f.requesterId === user?.id ? f.addresseeId : f.requesterId
    ),
    ...incomingRequests.map((f) => f.requesterId),
    ...outgoingRequests.map((f) => f.addresseeId),
  ]);
  const pendingOutgoing = new Map(
    outgoingRequests.map((f) => [f.addresseeId, f.id])
  );

  // Filter search results: exclude self and already-friends
  const filteredResults = searchResults.filter((p) => !existingIds.has(p.id));

  return (
    <div className="flex-1 p-[16px] md:p-[32px] w-full max-w-3xl mx-auto flex flex-col gap-8 mt-4 md:mt-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-5 -left-5 bg-secondary-container border-2 border-primary p-2 text-[20px] leading-[24px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-2 uppercase">
          TEMAN
        </div>
        <div className="bg-surface-container-lowest p-6 neo-border-3 neo-shadow-lg mt-4">
          {/* Search */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[14px] font-bold uppercase tracking-[0.05em] flex items-center gap-2">
              <span className="material-symbols-outlined">search</span>
              Cari Pengguna
            </label>
            <input
              className="bg-surface-container-low p-3 text-[16px] neo-input w-full placeholder-outline"
              type="text"
              placeholder="Nama atau username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Search results */}
          {(searching || filteredResults.length > 0) && (
            <div className="flex flex-col gap-2 mb-6">
              <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                Hasil Pencarian
              </div>
              {searching && (
                <div className="text-[13px] text-on-surface-variant p-3">Mencari…</div>
              )}
              {!searching && filteredResults.length === 0 && query.trim() && (
                <div className="text-[13px] text-on-surface-variant p-3">Tidak ada hasil</div>
              )}
              {filteredResults.map((p) => (
                <UserSearchResult
                  key={p.id}
                  profile={p}
                  isPending={pendingOutgoing.has(p.id)}
                  existingFriendshipId={pendingOutgoing.get(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <section>
          <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              person_add
            </span>
            Permintaan Masuk ({incomingRequests.length})
          </div>
          <div className="flex flex-col gap-2">
            {incomingRequests.map((f) => (
              <FriendRequestItem key={f.id} friendship={f} direction="incoming" />
            ))}
          </div>
        </section>
      )}

      {/* Outgoing requests */}
      {outgoingRequests.length > 0 && (
        <section>
          <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">pending</span>
            Permintaan Dikirim ({outgoingRequests.length})
          </div>
          <div className="flex flex-col gap-2">
            {outgoingRequests.map((f) => (
              <FriendRequestItem key={f.id} friendship={f} direction="outgoing" />
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            group
          </span>
          Daftar Teman ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div className="p-6 border-2 border-primary bg-surface-container-lowest text-center text-[14px] text-on-surface-variant uppercase tracking-[0.04em]">
            Belum ada teman. Cari pengguna di atas!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <FriendCard
                key={f.id}
                friendship={f}
                currentUserId={user?.id ?? ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Verify in browser**

`npm run dev` → navigate to `/friends` → confirm page renders, search input works, empty state shows.

- [ ] **Step 7: Commit**

```bash
git add src/app/friends/page.tsx src/components/friend-card.tsx src/components/friend-request-item.tsx src/components/user-search-result.tsx
git commit -m "feat(friends): halaman /friends dengan list teman, request, dan pencarian"
```

---

## Task 8: Reaction Bar + Comment Thread Components

**Files:**
- Create: `src/components/reaction-bar.tsx`
- Create: `src/components/comment-thread.tsx`

**Interfaces:**
- Consumes: `useSocialContext()` → `getActivityReactions`, `getActivityComments`, `addComment`, `toggleReaction`; `Reaction`, `Comment` types; `currentUserId: string`
- Produces: `<ReactionBar activityId ownerId currentUserId />`, `<CommentThread activityId ownerId currentUserId />`

- [ ] **Step 1: Create `src/components/reaction-bar.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Reaction } from "@/lib/types";

const EMOJIS = ["👍", "❤️", "🔥", "🎉", "💪", "👏"];

interface ReactionBarProps {
  activityId: string;
  ownerId: string;
  currentUserId: string;
}

export function ReactionBar({ activityId, ownerId, currentUserId }: ReactionBarProps) {
  const { getActivityReactions, toggleReaction } = useSocialContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const load = useCallback(async () => {
    const data = await getActivityReactions(activityId);
    setReactions(data);
  }, [activityId, getActivityReactions]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (emoji: string) => {
    await toggleReaction(activityId, emoji, ownerId);
    await load();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {EMOJIS.map((emoji) => {
        const emojiReactions = reactions.filter((r) => r.emoji === emoji);
        const myReaction = emojiReactions.find((r) => r.userId === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            className={`flex items-center gap-1 px-2 py-1 border-2 border-primary text-[14px] font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${
              myReaction
                ? "bg-secondary-container"
                : "bg-surface hover:bg-surface-container-low"
            }`}
            title={myReaction ? "Hapus reaksi" : "Tambah reaksi"}
          >
            <span>{emoji}</span>
            {emojiReactions.length > 0 && (
              <span className="text-[12px] font-black">{emojiReactions.length}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/comment-thread.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Comment } from "@/lib/types";

interface CommentThreadProps {
  activityId: string;
  ownerId: string;
  currentUserId: string;
}

export function CommentThread({ activityId, ownerId, currentUserId }: CommentThreadProps) {
  const { getActivityComments, addComment } = useSocialContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await getActivityComments(activityId);
    setComments(data);
  }, [activityId, getActivityComments]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      await addComment(activityId, input.trim(), ownerId);
      setInput("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t-2 border-outline-variant pt-4 flex flex-col gap-3">
      <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
        Komentar ({comments.length})
      </div>
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <span
            className="material-symbols-outlined text-[24px] text-primary shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_circle
          </span>
          <div className="flex-1 bg-surface-container-low border border-outline-variant p-2">
            <div className="text-[11px] text-on-surface-variant mb-1">
              {c.userId === currentUserId ? "Anda" : c.userId.slice(0, 8)}
              {" · "}
              {new Date(c.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-[14px]">{c.content}</div>
          </div>
        </div>
      ))}
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 bg-surface-container-low p-2 text-[14px] neo-input placeholder-outline"
          placeholder="Tulis komentar…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          className="px-4 py-2 border-2 border-primary bg-secondary-container font-bold text-[13px] uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/reaction-bar.tsx src/components/comment-thread.tsx
git commit -m "feat(social): komponen ReactionBar dan CommentThread"
```

---

## Task 9: Activity Modal

**Files:**
- Create: `src/components/activity-modal.tsx`

**Interfaces:**
- Consumes: `Activity` type; `<ReactionBar />`, `<CommentThread />`; `currentUserId: string`
- Produces: `<ActivityModal activity onClose currentUserId />` — overlay modal with activity detail, reactions, comments

- [ ] **Step 1: Create `src/components/activity-modal.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { Activity } from "@/lib/types";
import { ReactionBar } from "./reaction-bar";
import { CommentThread } from "./comment-thread";

interface ActivityModalProps {
  activity: Activity;
  currentUserId: string;
  onClose: () => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityModal({ activity, currentUserId, onClose }: ActivityModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface border-2 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 border border-primary ${
                activity.status === "completed" ? "bg-category-green" : "bg-priority-urgent"
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
              {activity.status === "completed" ? "Selesai" : "Berlangsung"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-[20px] hover:text-error transition-colors"
          >
            close
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <h2 className="text-[20px] font-black uppercase tracking-tight mb-2">
            {activity.title}
          </h2>
          <div className="text-[13px] text-on-surface-variant flex flex-col gap-1 mb-3">
            <span>
              <span className="font-bold">Mulai:</span> {formatDateTime(activity.startTime)}
            </span>
            <span>
              <span className="font-bold">Selesai:</span> {formatDateTime(activity.endTime)}
            </span>
          </div>

          {/* Reactions */}
          <div className="border-t-2 border-outline-variant pt-3">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
              Reaksi
            </div>
            <ReactionBar
              activityId={activity.id}
              ownerId={activity.userId}
              currentUserId={currentUserId}
            />
          </div>

          {/* Comments */}
          <CommentThread
            activityId={activity.id}
            ownerId={activity.userId}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/activity-modal.tsx
git commit -m "feat(social): komponen ActivityModal dengan detail, reaksi, dan komentar"
```

---

## Task 10: Friend Calendar + `/friends/[id]` Page

**Files:**
- Create: `src/components/friend-calendar.tsx`
- Create: `src/app/friends/[id]/page.tsx`

**Interfaces:**
- Consumes: `useSocialContext()` → `getFriendActivities`; `Activity` type; `<ActivityModal />`; `useTaskContext()` → `user`
- Produces: `/friends/[id]` page with week/month toggle calendar; click event → `ActivityModal`

- [ ] **Step 1: Create `src/components/friend-calendar.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Activity } from "@/lib/types";
import { ActivityModal } from "./activity-modal";

const DAYS_SHORT = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number): (number | null)[] {
  let startDay = new Date(year, month, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

interface FriendCalendarProps {
  friendId: string;
  currentUserId: string;
}

export function FriendCalendar({ friendId, currentUserId }: FriendCalendarProps) {
  const { getFriendActivities } = useSocialContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Activity | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getFriendActivities(friendId);
    setActivities(data);
    setLoading(false);
  }, [friendId, getFriendActivities]);

  useEffect(() => { load(); }, [load]);

  // Map activities by YYYY-MM-DD
  const byDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const key = a.startTime ? formatYMD(new Date(a.startTime)) : "";
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [activities]);

  const todayStr = formatYMD(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    .toUpperCase();

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant uppercase text-[13px] font-bold tracking-[0.05em]">Memuat kalender…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["week", "month"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 border-2 border-primary text-[12px] font-bold uppercase tracking-[0.04em] transition-all ${
                viewMode === mode
                  ? "bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-surface hover:bg-surface-container-low"
              }`}
            >
              {mode === "week" ? "Minggu" : "Bulan"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1 border-2 border-primary bg-surface hover:bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[14px] font-black uppercase tracking-tight min-w-[140px] text-center">{monthName}</span>
          <button onClick={nextPeriod} className="p-1 border-2 border-primary bg-surface hover:bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-black uppercase tracking-[0.05em] py-1 text-on-surface-variant">
            {d}
          </div>
        ))}
      </div>

      {/* Month view */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-px border-2 border-primary">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square bg-surface-container-low opacity-30" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayActivities = byDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={i}
                className={`aspect-square flex flex-col p-1 bg-surface cursor-default border border-outline-variant ${
                  isToday ? "bg-secondary-container" : ""
                }`}
              >
                <span className={`text-[11px] font-black ${isToday ? "text-primary" : "text-on-surface-variant"}`}>{day}</span>
                <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                  {dayActivities.slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="text-left text-[9px] font-bold uppercase truncate px-1 bg-priority-delegate text-on-primary border border-primary leading-tight"
                    >
                      {a.title}
                    </button>
                  ))}
                  {dayActivities.length > 2 && (
                    <span className="text-[9px] text-on-surface-variant">+{dayActivities.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week view */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-px border-2 border-primary">
          {weekDates.map((date, i) => {
            const dateStr = formatYMD(date);
            const dayActivities = byDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={i}
                className={`min-h-[120px] flex flex-col p-1 bg-surface border border-outline-variant ${
                  isToday ? "bg-secondary-container" : ""
                }`}
              >
                <span className={`text-[11px] font-black mb-1 ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayActivities.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="text-left text-[10px] font-bold uppercase truncate px-1 py-0.5 bg-priority-delegate text-on-primary border border-primary"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {activities.length === 0 && (
        <div className="text-center p-6 border-2 border-primary text-[13px] text-on-surface-variant uppercase tracking-[0.04em]">
          Teman ini belum membagikan tugas apa pun
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ActivityModal
          activity={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/friends/[id]/page.tsx`**

```typescript
"use client";

import { use } from "react";
import Link from "next/link";
import { useTaskContext } from "@/lib/task-context";
import { FriendCalendar } from "@/components/friend-calendar";

export default function FriendCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: friendId } = use(params);
  const { user } = useTaskContext();

  if (!user) {
    return (
      <div className="flex-1 p-8 text-center text-on-surface-variant uppercase text-[13px] font-bold">
        Memuat…
      </div>
    );
  }

  return (
    <div className="flex-1 p-[16px] md:p-[32px] w-full max-w-4xl mx-auto flex flex-col gap-6 mt-4 md:mt-8">
      {/* Back */}
      <Link
        href="/friends"
        className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Teman
      </Link>

      {/* Header */}
      <div className="relative">
        <div className="absolute -top-5 -left-5 bg-secondary-container border-2 border-primary p-2 text-[18px] leading-[22px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-1 uppercase">
          KALENDER TEMAN
        </div>
        <div className="bg-surface-container-lowest p-6 neo-border-3 neo-shadow-lg mt-4">
          <FriendCalendar friendId={friendId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Verify in browser**

Navigate to `/friends/some-uuid` → calendar renders, week/month toggle works, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/friend-calendar.tsx src/app/friends/[id]/page.tsx
git commit -m "feat(friends): kalender jadwal teman dan halaman /friends/[id]"
```

---

## Task 11: Username Setup in Settings Page

Users need a `username` and `name` in `profiles` to be discoverable via search. The settings page already lets users edit `name`. We need to also let them set `username`.

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `useTaskContext()` → `profile`, `updateProfileName`; supabase client for username update
- Produces: username input field in settings; upsert `profiles.username`

- [ ] **Step 1: Read current settings page**

```bash
Get-Content -LiteralPath "src\app\settings\page.tsx" -Total 60
```

- [ ] **Step 2: Add username field to settings form**

In `src/app/settings/page.tsx`, add username state and save logic. Import `createClient`:

```typescript
import { createClient } from "@/lib/supabase/client";
```

Add state (after existing `name` state):
```typescript
const [username, setUsername] = useState(profile?.username ?? "");
const [usernameSaving, setUsernameSaving] = useState(false);
const [usernameError, setUsernameError] = useState<string | null>(null);
```

Add save handler:
```typescript
const handleSaveUsername = async () => {
  if (!username.trim()) return;
  setUsernameSaving(true);
  setUsernameError(null);
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username: username.trim().toLowerCase() })
    .eq("id", profile!.id);
  if (error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      setUsernameError("Username sudah dipakai");
    } else {
      setUsernameError("Gagal menyimpan");
    }
  }
  setUsernameSaving(false);
};
```

Add username input section below the name field in the JSX:
```typescript
<div className="flex flex-col gap-2">
  <label className="text-[14px] font-bold uppercase tracking-[0.05em]" htmlFor="username">
    Username
  </label>
  <div className="flex gap-2">
    <input
      id="username"
      className="flex-1 bg-surface-container-low p-3 text-[16px] neo-input"
      placeholder="contoh: budi123"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      maxLength={30}
    />
    <button
      onClick={handleSaveUsername}
      disabled={usernameSaving || !username.trim()}
      className="px-4 py-2 border-2 border-primary bg-secondary-container font-bold text-[13px] uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
    >
      {usernameSaving ? "…" : "Simpan"}
    </button>
  </div>
  {usernameError && (
    <div className="text-[12px] text-error font-bold">{usernameError}</div>
  )}
  <div className="text-[11px] text-on-surface-variant">
    Username digunakan agar teman bisa menemukan akunmu melalui pencarian
  </div>
</div>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat(settings): tambah field username agar bisa ditemukan teman"
```

---

## Task 12: RLS Verification SQL Script

**Files:**
- Create: `supabase/verify_social_rls.sql`

**Interfaces:**
- Produces: runnable SQL assertions to verify RLS behavior (run in Supabase SQL Editor)

- [ ] **Step 1: Create `supabase/verify_social_rls.sql`**

```sql
-- Run as service role in Supabase SQL Editor to verify RLS behavior.
-- Replace USER_A_ID and USER_B_ID with real user IDs from auth.users.

-- 1. Verify public_profiles does NOT expose sensitive columns
do $$
begin
  assert (
    select count(*) = 0
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_profiles'
      and column_name in ('telegram_chat_id', 'telegram_link_code', 'email')
  ), 'FAIL: public_profiles exposes sensitive columns';
  raise notice 'PASS: public_profiles has no sensitive columns';
end $$;

-- 2. Verify friendships unique constraint prevents self-request
-- (Run as USER_A):
-- insert into friendships (requester_id, addressee_id) values (USER_A_ID, USER_A_ID);
-- Expected: ERROR: new row violates check constraint "friendships_check"

-- 3. Verify activities RLS: non-friend cannot see activity
-- Set role to USER_B who is NOT a friend of USER_A:
-- set local role authenticated;
-- set local "request.jwt.claims" to '{"sub":"USER_B_ID"}';
-- select count(*) from activities where user_id = 'USER_A_ID';
-- Expected: 0

-- 4. Verify notifications: user cannot insert notification as another actor
-- (Run as USER_A):
-- insert into notifications (user_id, actor_id, type) values (USER_B_ID, USER_B_ID, 'friend_request');
-- Expected: ERROR: new row violates row-level security policy

-- 5. Count RLS-enabled tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('friendships','activities','comments','reactions','notifications')
order by tablename;
-- Expected: all rows show rowsecurity = true
```

- [ ] **Step 2: Commit**

```bash
git add supabase/verify_social_rls.sql
git commit -m "test(rls): skrip verifikasi RLS untuk fitur sosial"
```

---

## Task 13: Final Build Check

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npx eslint src --max-warnings=0
```

Expected: no lint errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Manual browser smoke test**

With `npm run dev`:

1. Login → `/friends` renders without errors
2. Settings → set username → save succeeds
3. Search for another user by name/username → result appears
4. Send friend request → appears in outgoing
5. In second browser session (other user): incoming request visible → Accept
6. Both users: friend appears in list; bell badge clears after open
7. Click friend → `/friends/[friendId]` → calendar renders
8. Create task with "Bagikan ke teman" ON → activity appears in friend's calendar
9. Click event → ActivityModal opens → add reaction → add comment → both persist on reload
10. Unfriend → friend disappears, calendar shows empty state (RLS blocks data)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(social): implementasi lengkap fitur pertemanan, kalender teman, komentar & reaksi"
```
