-- Repair the profile table for projects where the original store schema was
-- not applied, and safely backfill users created before the profile trigger.
do $$ begin
  create type public.app_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Add columns that may be absent on an older/incomplete profiles table.
alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role public.app_role;
alter table public.profiles add column if not exists created_at timestamptz;

-- If an older table had email but no Auth UUID, attach rows only when there is
-- an unambiguous matching Auth account. Unmatched rows stop the migration at
-- the NOT NULL step below and need review instead of being assigned an owner.
update public.profiles p
set id = u.id
from auth.users u
where p.id is null and p.email = u.email;

alter table public.profiles alter column full_name set default '';
alter table public.profiles alter column role set default 'customer';
alter table public.profiles alter column created_at set default now();

-- Existing records receive safe defaults; auth.users is the source of truth
-- for the identity and email. Preserve any existing names, phones, and roles.
update public.profiles p
set email = coalesce(nullif(p.email, ''), u.email),
    full_name = coalesce(p.full_name, ''),
    role = coalesce(p.role, 'customer'::public.app_role),
    created_at = coalesce(p.created_at, now())
from auth.users u
where u.id = p.id;

alter table public.profiles alter column id set not null;
alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column email set not null;
alter table public.profiles alter column role set not null;
alter table public.profiles alter column created_at set not null;

create unique index if not exists profiles_id_key on public.profiles (id);
create unique index if not exists profiles_email_key on public.profiles (email);

-- A profile always has the same UUID as its Auth user.
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
      and conkey = array[(select attnum::smallint from pg_attribute
                           where attrelid = 'public.profiles'::regclass and attname = 'id')]
  ) then
    alter table public.profiles add constraint profiles_id_auth_users_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Idempotent backfill for users whose signup happened without the trigger.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where u.email is not null
on conflict (id) do update
set email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name
                     else public.profiles.full_name end;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    raise exception 'An email address is required to create a profile';
  end if;
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when public.profiles.full_name = '' then excluded.full_name
                         else public.profiles.full_name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
) $$;

drop policy if exists "profiles view own or admin" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles update own safe fields" on public.profiles;
create policy "profiles view own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles insert own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and role = 'customer');

create or replace function public.current_profile_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create policy "profiles update own safe fields" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.current_profile_role());

revoke all on public.profiles from anon;
revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (id, email, full_name, phone) on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Ask PostgREST to refresh its schema cache after the table is created/repaired.
notify pgrst, 'reload schema';
