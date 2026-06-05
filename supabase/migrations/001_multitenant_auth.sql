-- Multi-Tenant Supabase Starter — complete schema (single migration)
-- Platform owners own organizations; customers register per org with the same email across orgs.
--
-- Applied once via Supabase SQL Editor (Dashboard → SQL → New query).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_by uuid not null,
  site_domain text not null default '',
  tagline text not null default '',
  theme text not null default 'light'
    check (theme in ('light', 'dark', 'ocean', 'ember')),
  layout text not null default 'centered'
    check (layout in ('centered', 'split')),
  created_at timestamptz default now()
);

create table public.auth_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  real_email text not null,
  internal_email text not null,
  created_at timestamptz default now(),
  unique (tenant_id, real_email),
  unique (internal_email)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  display_name text not null default '',
  notes text not null default '',
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);

create table public.platform_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Server-only operational tables (service role): rate limits and idempotency
create table public.idempotency_keys (
  namespace text not null,
  key text not null,
  status_code int not null,
  body jsonb not null,
  expires_at timestamptz not null,
  primary key (namespace, key)
);

create table public.rate_limit_buckets (
  bucket_key text primary key,
  count int not null default 0,
  reset_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.auth_mappings enable row level security;
alter table public.profiles enable row level security;
alter table public.platform_owners enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.rate_limit_buckets enable row level security;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.jwt_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')::uuid;
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_owners where user_id = auth.uid()
  );
$$;

create or replace function public.register_platform_owner()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if exists (select 1 from public.auth_mappings where user_id = auth.uid()) then
    raise exception 'Customer accounts cannot register as platform owners';
  end if;

  insert into public.platform_owners (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.lookup_internal_email(
  p_tenant_id uuid,
  p_real_email text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select internal_email
  from public.auth_mappings
  where tenant_id = p_tenant_id
    and real_email = lower(trim(p_real_email))
  limit 1;
$$;

create or replace function public.customer_email_taken(
  p_tenant_id uuid,
  p_real_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.auth_mappings
    where tenant_id = p_tenant_id
      and real_email = lower(trim(p_real_email))
  );
$$;

create or replace function public.create_owned_tenant(
  p_slug text,
  p_name text,
  p_site_domain text,
  p_tagline text,
  p_theme text,
  p_layout text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_row public.tenants;
begin
  if not public.is_platform_owner() then
    raise exception 'Platform owner account required';
  end if;

  select count(*)::int into v_count
  from public.tenants
  where created_by = auth.uid();

  if v_count >= 100 then
    raise exception 'Maximum of 100 orgs per account';
  end if;

  insert into public.tenants (
    slug, name, created_by, site_domain, tagline, theme, layout
  )
  values (
    p_slug, p_name, auth.uid(), p_site_domain, p_tagline, p_theme, p_layout
  )
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'This URL slug is already taken';
end;
$$;

create or replace function public.delete_owned_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_owner() then
    raise exception 'Platform owner account required';
  end if;

  if not exists (
    select 1
    from public.tenants
    where id = p_tenant_id
      and created_by = auth.uid()
  ) then
    raise exception 'Organization not found';
  end if;

  delete from auth.users
  where id in (
    select user_id
    from public.auth_mappings
    where tenant_id = p_tenant_id
  );

  delete from public.tenants
  where id = p_tenant_id
    and created_by = auth.uid();
end;
$$;

create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  t_id uuid;
  real_em text;
  disp_name text;
  tenant_name text;
begin
  meta := new.raw_user_meta_data;

  if coalesce(meta ->> 'role', '') = 'platform_owner' then
    raise exception 'Invalid signup metadata';
  end if;

  if meta ->> 'role' is distinct from 'customer' then
    return new;
  end if;

  t_id := nullif(meta ->> 'tenant_id', '')::uuid;
  real_em := lower(trim(meta ->> 'real_email'));
  disp_name := coalesce(
    nullif(trim(meta ->> 'display_name'), ''),
    split_part(real_em, '@', 1)
  );

  if t_id is null or real_em is null or real_em = '' then
    raise exception 'customer signup missing tenant_id or real_email metadata';
  end if;

  select name into tenant_name from public.tenants where id = t_id;

  insert into public.auth_mappings (tenant_id, user_id, real_email, internal_email)
  values (t_id, new.id, real_em, new.email);

  insert into public.profiles (tenant_id, user_id, display_name, notes)
  values (
    t_id,
    new.id,
    disp_name,
    coalesce('Signed up on ' || tenant_name, 'Signed up')
  );

  return new;
exception
  when unique_violation then
    raise exception 'Unable to create account';
end;
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

create policy "Tenants are publicly readable"
  on public.tenants for select
  using (true);

create policy "Platform owners may insert tenants"
  on public.tenants for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_platform_owner()
  );

create policy "Platform owners may update own tenants"
  on public.tenants for update
  to authenticated
  using (
    created_by = auth.uid()
    and public.is_platform_owner()
  )
  with check (
    created_by = auth.uid()
    and public.is_platform_owner()
  );

create policy "Platform owners may delete own tenants"
  on public.tenants for delete
  to authenticated
  using (
    created_by = auth.uid()
    and public.is_platform_owner()
  );

create policy "Auth mappings are server-only"
  on public.auth_mappings for all
  using (false);

create policy "Users may read own tenant profile"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = user_id
    and tenant_id = public.jwt_tenant_id()
  );

create policy "Users may update own tenant profile"
  on public.profiles for update
  to authenticated
  using (
    auth.uid() = user_id
    and tenant_id = public.jwt_tenant_id()
  )
  with check (
    auth.uid() = user_id
    and tenant_id = public.jwt_tenant_id()
  );

create policy "Users may read own platform owner row"
  on public.platform_owners for select
  to authenticated
  using (user_id = auth.uid());

-- idempotency_keys and rate_limit_buckets: RLS enabled, no client policies (service role only)

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger on_auth_customer_created
  after insert on auth.users
  for each row
  execute function public.handle_new_customer_user();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index tenants_slug_idx on public.tenants (slug);
create index tenants_created_by_created_at_idx
  on public.tenants (created_by, created_at desc, id desc);
create index auth_mappings_tenant_real_email_idx
  on public.auth_mappings (tenant_id, real_email);
create index auth_mappings_user_id_idx
  on public.auth_mappings (user_id);
create index profiles_tenant_user_idx
  on public.profiles (tenant_id, user_id);
create index idempotency_keys_expires_idx
  on public.idempotency_keys (expires_at);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.is_platform_owner() to anon, authenticated;
grant execute on function public.register_platform_owner() to authenticated;
grant execute on function public.lookup_internal_email(uuid, text) to anon, authenticated;
grant execute on function public.customer_email_taken(uuid, text) to anon, authenticated;
grant execute on function public.create_owned_tenant(text, text, text, text, text, text)
  to authenticated;
grant execute on function public.delete_owned_tenant(uuid) to authenticated;
