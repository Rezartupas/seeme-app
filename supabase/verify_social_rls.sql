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
