
-- PRESSED IN PINK ORDER SYSTEM
-- Run this entire file once in:
-- Supabase Dashboard > SQL Editor > New query

create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create sequence if not exists
  public.order_number_seq
  start 1;

create table if not exists
  public.profiles (
    id uuid primary key
      references auth.users(id)
      on delete cascade,
    full_name text not null default '',
    email text not null default '',
    phone text not null default '',
    role text not null default 'customer'
      check (
        role in (
          'customer',
          'admin'
        )
      ),
    created_at timestamptz
      not null default now(),
    updated_at timestamptz
      not null default now()
  );

create table if not exists
  public.orders (
    id uuid primary key
      default gen_random_uuid(),
    order_number text
      not null unique,
    customer_id uuid not null
      references auth.users(id)
      on delete cascade,
    checkout_type text
      not null
      check (
        checkout_type in (
          'guest',
          'account'
        )
      ),
    customer_name text
      not null,
    customer_email text
      not null,
    customer_phone text
      not null,
    customer_notes text
      not null default '',
    status text
      not null default 'submitted'
      check (
        status in (
          'submitted',
          'under_review',
          'awaiting_customer_approval',
          'approved',
          'changes_requested',
          'invoice_sent',
          'paid',
          'preparing',
          'ready',
          'completed',
          'cancelled'
        )
      ),
    customer_approval_status text
      not null default 'not_required'
      check (
        customer_approval_status in (
          'not_required',
          'pending',
          'approved',
          'changes_requested'
        )
      ),
    revision_message text
      not null default '',
    admin_notes text
      not null default '',
    submitted_at timestamptz
      not null default now(),
    updated_at timestamptz
      not null default now()
  );

create table if not exists
  public.order_items (
    id uuid primary key
      default gen_random_uuid(),
    order_id uuid not null
      references public.orders(id)
      on delete cascade,
    product_id text not null,
    display_name text not null,
    category_slug text not null,
    category_name text not null,
    image_number integer not null
      check (image_number > 0),
    source_filename text not null,
    thumbnail_url text not null,
    full_image_url text not null,
    requested_quantity integer
      not null
      check (
        requested_quantity
          between 1 and 999
      ),
    approved_quantity integer
      not null
      check (
        approved_quantity
          between 0 and 999
      ),
    is_available boolean
      not null default true,
    admin_note text
      not null default '',
    created_at timestamptz
      not null default now(),
    updated_at timestamptz
      not null default now()
  );

create table if not exists
  public.order_events (
    id bigint generated always
      as identity primary key,
    order_id uuid not null
      references public.orders(id)
      on delete cascade,
    event_type text not null,
    message text not null default '',
    created_by uuid
      references auth.users(id)
      on delete set null,
    created_at timestamptz
      not null default now()
  );

create index if not exists
  profiles_role_idx
  on public.profiles(role);

create index if not exists
  orders_customer_id_idx
  on public.orders(customer_id);

create index if not exists
  orders_status_idx
  on public.orders(status);

create index if not exists
  orders_submitted_at_idx
  on public.orders(
    submitted_at desc
  );

create index if not exists
  order_items_order_id_idx
  on public.order_items(order_id);

create index if not exists
  order_events_order_id_idx
  on public.order_events(order_id);

create or replace function
  public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function
  public.set_updated_at();

drop trigger if exists
  orders_set_updated_at
  on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function
  public.set_updated_at();

drop trigger if exists
  order_items_set_updated_at
  on public.order_items;

create trigger order_items_set_updated_at
before update on public.order_items
for each row
execute function
  public.set_updated_at();

create or replace function
  private.is_admin()
returns boolean
language sql
stable
security definer
set search_path =
  public,
  pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id =
      (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function
  private.is_admin()
  from public;

grant execute on function
  private.is_admin()
  to authenticated;

create or replace function
  public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data
        ->> 'full_name',
      ''
    ),
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data
        ->> 'phone',
      ''
    ),
    'customer'
  )
  on conflict (id)
  do update set
    email = excluded.email,
    full_name = case
      when public.profiles.full_name = ''
        then excluded.full_name
      else public.profiles.full_name
    end,
    phone = case
      when public.profiles.phone = ''
        then excluded.phone
      else public.profiles.phone
    end;

  return new;
end;
$$;

drop trigger if exists
  on_auth_user_created
  on auth.users;

create trigger
  on_auth_user_created
after insert on auth.users
for each row
execute function
  public.handle_new_user();

insert into public.profiles (
  id,
  full_name,
  email,
  phone,
  role
)
select
  users.id,
  coalesce(
    users.raw_user_meta_data
      ->> 'full_name',
    ''
  ),
  coalesce(users.email, ''),
  coalesce(
    users.raw_user_meta_data
      ->> 'phone',
    ''
  ),
  'customer'
from auth.users as users
on conflict (id) do nothing;

create or replace function
  public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path =
  public,
  private,
  pg_temp
as $$
begin
  if
    (select auth.uid())
      is not null
    and new.role
      is distinct from old.role
    and not private.is_admin()
  then
    raise exception
      'Only an administrator can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  protect_profile_role_trigger
  on public.profiles;

create trigger
  protect_profile_role_trigger
before update on public.profiles
for each row
execute function
  public.protect_profile_role();

alter table public.profiles
  enable row level security;

alter table public.orders
  enable row level security;

alter table public.order_items
  enable row level security;

alter table public.order_events
  enable row level security;

drop policy if exists
  "Profiles select own or admin"
  on public.profiles;

create policy
  "Profiles select own or admin"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or
  (select private.is_admin())
);

drop policy if exists
  "Profiles update own or admin"
  on public.profiles;

create policy
  "Profiles update own or admin"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or
  (select private.is_admin())
)
with check (
  id = (select auth.uid())
  or
  (select private.is_admin())
);

drop policy if exists
  "Orders select own or admin"
  on public.orders;

create policy
  "Orders select own or admin"
on public.orders
for select
to authenticated
using (
  customer_id =
    (select auth.uid())
  or
  (select private.is_admin())
);

drop policy if exists
  "Orders admin update"
  on public.orders;

create policy
  "Orders admin update"
on public.orders
for update
to authenticated
using (
  (select private.is_admin())
)
with check (
  (select private.is_admin())
);

drop policy if exists
  "Order items select own or admin"
  on public.order_items;

create policy
  "Order items select own or admin"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id =
      order_items.order_id
      and (
        orders.customer_id =
          (select auth.uid())
        or
        (select private.is_admin())
      )
  )
);

drop policy if exists
  "Order items admin update"
  on public.order_items;

create policy
  "Order items admin update"
on public.order_items
for update
to authenticated
using (
  (select private.is_admin())
)
with check (
  (select private.is_admin())
);

drop policy if exists
  "Order events select own or admin"
  on public.order_events;

create policy
  "Order events select own or admin"
on public.order_events
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id =
      order_events.order_id
      and (
        orders.customer_id =
          (select auth.uid())
        or
        (select private.is_admin())
      )
  )
);

drop policy if exists
  "Order events admin insert"
  on public.order_events;

create policy
  "Order events admin insert"
on public.order_events
for insert
to authenticated
with check (
  (select private.is_admin())
  and created_by =
    (select auth.uid())
);

revoke all on
  public.profiles,
  public.orders,
  public.order_items,
  public.order_events
from anon;

grant select, update
on public.profiles
to authenticated;

grant select, update
on public.orders
to authenticated;

grant select, update
on public.order_items
to authenticated;

grant select, insert
on public.order_events
to authenticated;

create or replace function
  public.submit_order(
    p_checkout_type text,
    p_customer_name text,
    p_customer_email text,
    p_customer_phone text,
    p_customer_notes text,
    p_items jsonb
  )
returns table (
  order_id uuid,
  order_number text
)
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_quantity integer;
  v_image_number integer;
  v_thumbnail_url text;
  v_full_image_url text;
begin
  v_user_id =
    (select auth.uid());

  if v_user_id is null then
    raise exception
      'An authenticated checkout session is required.';
  end if;

  if p_checkout_type not in (
    'guest',
    'account'
  ) then
    raise exception
      'Invalid checkout type.';
  end if;

  if
    p_checkout_type = 'account'
    and coalesce(
      (
        select (
          auth.jwt()
            ->> 'is_anonymous'
        )::boolean
      ),
      false
    )
  then
    raise exception
      'Sign in to use account checkout.';
  end if;

  if
    char_length(
      trim(p_customer_name)
    ) < 2
    or char_length(
      trim(p_customer_name)
    ) > 120
  then
    raise exception
      'Enter a valid customer name.';
  end if;

  if
    char_length(
      trim(p_customer_email)
    ) > 254
    or position(
      '@' in p_customer_email
    ) < 2
  then
    raise exception
      'Enter a valid email address.';
  end if;

  if
    p_items is null
    or jsonb_typeof(p_items)
      <> 'array'
    or jsonb_array_length(
      p_items
    ) = 0
  then
    raise exception
      'The order must contain at least one item.';
  end if;

  if
    jsonb_array_length(
      p_items
    ) > 500
  then
    raise exception
      'The order contains too many different designs.';
  end if;

  v_order_number =
    'PNP-'
    || to_char(now(), 'YYYY')
    || '-'
    || lpad(
      nextval(
        'public.order_number_seq'
      )::text,
      6,
      '0'
    );

  insert into public.orders (
    order_number,
    customer_id,
    checkout_type,
    customer_name,
    customer_email,
    customer_phone,
    customer_notes,
    status,
    customer_approval_status
  )
  values (
    v_order_number,
    v_user_id,
    p_checkout_type,
    trim(p_customer_name),
    trim(p_customer_email),
    coalesce(
      trim(p_customer_phone),
      ''
    ),
    left(
      coalesce(
        trim(p_customer_notes),
        ''
      ),
      1500
    ),
    'submitted',
    'not_required'
  )
  returning id
  into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(
      p_items
    )
  loop
    v_quantity =
      (v_item
        ->> 'quantity')::integer;

    v_image_number =
      (v_item
        ->> 'imageNumber')::integer;

    v_thumbnail_url =
      v_item
        ->> 'thumbnailUrl';

    v_full_image_url =
      v_item
        ->> 'fullImageUrl';

    if
      v_quantity
        not between 1 and 999
    then
      raise exception
        'Invalid item quantity.';
    end if;

    if
      v_image_number < 1
    then
      raise exception
        'Invalid image number.';
    end if;

    if
      v_thumbnail_url not like
        'https://images.pressedinpink.com/%'
      or
      v_full_image_url not like
        'https://images.pressedinpink.com/%'
    then
      raise exception
        'Invalid image URL.';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      display_name,
      category_slug,
      category_name,
      image_number,
      source_filename,
      thumbnail_url,
      full_image_url,
      requested_quantity,
      approved_quantity,
      is_available
    )
    values (
      v_order_id,
      left(
        coalesce(
          v_item ->> 'id',
          ''
        ),
        120
      ),
      left(
        coalesce(
          v_item
            ->> 'displayName',
          ''
        ),
        120
      ),
      left(
        coalesce(
          v_item
            ->> 'categorySlug',
          ''
        ),
        100
      ),
      left(
        coalesce(
          v_item
            ->> 'categoryName',
          ''
        ),
        160
      ),
      v_image_number,
      left(
        coalesce(
          v_item
            ->> 'sourceFilename',
          ''
        ),
        180
      ),
      v_thumbnail_url,
      v_full_image_url,
      v_quantity,
      v_quantity,
      true
    );
  end loop;

  insert into public.order_events (
    order_id,
    event_type,
    message,
    created_by
  )
  values (
    v_order_id,
    'submitted',
    'Order request submitted.',
    v_user_id
  );

  return query
  select
    v_order_id,
    v_order_number;
end;
$$;

revoke all on function
  public.submit_order(
    text,
    text,
    text,
    text,
    text,
    jsonb
  )
from public, anon;

grant execute on function
  public.submit_order(
    text,
    text,
    text,
    text,
    text,
    jsonb
  )
to authenticated;

create or replace function
  public.respond_to_order_revision(
    p_order_id uuid,
    p_response text,
    p_message text default ''
  )
returns void
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $$
declare
  v_user_id uuid;
  v_updated_order uuid;
begin
  v_user_id =
    (select auth.uid());

  if v_user_id is null then
    raise exception
      'Authentication is required.';
  end if;

  if p_response not in (
    'approved',
    'changes_requested'
  ) then
    raise exception
      'Invalid revision response.';
  end if;

  update public.orders
  set
    customer_approval_status =
      p_response,
    status = case
      when p_response = 'approved'
        then 'approved'
      else 'changes_requested'
    end,
    customer_notes = case
      when p_response =
        'changes_requested'
      then concat_ws(
        E'\n\n',
        nullif(
          customer_notes,
          ''
        ),
        'Customer revision response: '
        || left(
          coalesce(
            trim(p_message),
            ''
          ),
          1000
        )
      )
      else customer_notes
    end
  where id = p_order_id
    and customer_id = v_user_id
    and status =
      'awaiting_customer_approval'
    and customer_approval_status =
      'pending'
  returning id
  into v_updated_order;

  if v_updated_order is null then
    raise exception
      'This order is not currently waiting for your approval.';
  end if;

  insert into public.order_events (
    order_id,
    event_type,
    message,
    created_by
  )
  values (
    p_order_id,
    p_response,
    case
      when p_response = 'approved'
        then 'Customer approved the revision.'
      else
        'Customer requested additional changes: '
        || left(
          coalesce(
            trim(p_message),
            ''
          ),
          1000
        )
    end,
    v_user_id
  );
end;
$$;

revoke all on function
  public.respond_to_order_revision(
    uuid,
    text,
    text
  )
from public, anon;

grant execute on function
  public.respond_to_order_revision(
    uuid,
    text,
    text
  )
to authenticated;
