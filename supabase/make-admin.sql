
-- Create your normal account using /signup.
-- In Supabase, open Authentication > Users
-- and copy that account's User UID.
-- Replace both placeholders below, then run.

update public.profiles
set role = 'admin'
where id =
  'PASTE_USER_UID_HERE'::uuid;

select
  id,
  full_name,
  email,
  role
from public.profiles
where id =
  'PASTE_USER_UID_HERE'::uuid;
