
-- PRESSED IN PINK
-- ORDER PORTAL + PREFERRED CONTACT MIGRATION
--
-- Run this entire file in:
-- Supabase Dashboard > SQL Editor > New query
--
-- Existing orders remain intact.
-- New orders receive a secure private portal token.
-- Older test orders will not receive a portal token retroactively.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists
    contact_method text;

alter table public.orders
  add column if not exists
    contact_value text;

alter table public.orders
  add column if not exists
    portal_token_hash text;

update public.orders
set
  contact_method =
    coalesce(
      nullif(contact_method, ''),
      'email'
    ),
  contact_value =
    coalesce(
      nullif(contact_value, ''),
      customer_email
    );

alter table public.orders
  alter column contact_method
    set default 'email';

alter table public.orders
  alter column contact_value
    set default '';

alter table public.orders
  alter column contact_method
    set not null;

alter table public.orders
  alter column contact_value
    set not null;

alter table public.orders
  drop constraint if exists
    orders_contact_method_check;

alter table public.orders
  add constraint
    orders_contact_method_check
  check (
    contact_method in (
      'email',
      'phone',
      'instagram',
      'tiktok'
    )
  );

create unique index if not exists
  orders_portal_token_hash_idx
on public.orders(portal_token_hash)
where portal_token_hash is not null;

drop function if exists
  public.submit_order(
    text,
    text,
    text,
    text,
    text,
    jsonb
  );

drop function if exists
  public.submit_order(
    text,
    text,
    text,
    text,
    text,
    text,
    jsonb
  );

drop function if exists
  public.submit_order(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    jsonb
  );

create or replace function
  public.submit_order(
    p_checkout_type text,
    p_customer_name text,
    p_customer_email text,
    p_customer_notes text,
    p_contact_method text,
    p_contact_value text,
    p_items jsonb
  )
returns table (
  order_id uuid,
  order_number text,
  access_token text
)
language plpgsql
security definer
set search_path =
  public,
  extensions,
  pg_temp
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_access_token text;
  v_access_token_hash text;
  v_item jsonb;
  v_quantity integer;
  v_image_number integer;
  v_thumbnail_url text;
  v_full_image_url text;
  v_contact_value text;
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

  if p_contact_method not in (
    'email',
    'phone',
    'instagram',
    'tiktok'
  ) then
    raise exception
      'Choose a valid preferred contact method.';
  end if;

  v_contact_value =
    trim(
      coalesce(
        p_contact_value,
        ''
      )
    );

  if
    char_length(v_contact_value)
      < 2
    or char_length(v_contact_value)
      > 180
  then
    raise exception
      'Enter a valid preferred contact.';
  end if;

  if
    p_contact_method = 'email'
    and position(
      '@' in v_contact_value
    ) < 2
  then
    raise exception
      'Enter a valid contact email.';
  end if;

  if
    p_contact_method = 'phone'
    and char_length(
      regexp_replace(
        v_contact_value,
        '[^0-9]',
        '',
        'g'
      )
    ) < 7
  then
    raise exception
      'Enter a valid contact phone number.';
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
    || to_char(
      now(),
      'YYYY'
    )
    || '-'
    || lpad(
      nextval(
        'public.order_number_seq'
      )::text,
      6,
      '0'
    );

  v_access_token =
    encode(
      gen_random_bytes(32),
      'hex'
    );

  v_access_token_hash =
    encode(
      digest(
        v_access_token,
        'sha256'
      ),
      'hex'
    );

  insert into public.orders (
    order_number,
    customer_id,
    checkout_type,
    customer_name,
    customer_email,
    customer_phone,
    contact_method,
    contact_value,
    portal_token_hash,
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
    '',
    p_contact_method,
    v_contact_value,
    v_access_token_hash,
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
    v_order_number,
    v_access_token;
end;
$$;

revoke all on function
  public.submit_order(
    text,
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
    text,
    jsonb
  )
to authenticated;

create or replace function
  public.get_order_by_access_token(
    p_order_id uuid,
    p_access_token text
  )
returns jsonb
language plpgsql
security definer
set search_path =
  public,
  extensions,
  pg_temp
as $$
declare
  v_token_hash text;
  v_result jsonb;
begin
  if
    p_order_id is null
    or char_length(
      coalesce(
        p_access_token,
        ''
      )
    ) < 32
  then
    return null;
  end if;

  v_token_hash =
    encode(
      digest(
        p_access_token,
        'sha256'
      ),
      'hex'
    );

  select
    jsonb_build_object(
      'id',
        order_row.id,
      'order_number',
        order_row.order_number,
      'customer_id',
        order_row.customer_id,
      'checkout_type',
        order_row.checkout_type,
      'customer_name',
        order_row.customer_name,
      'customer_email',
        order_row.customer_email,
      'customer_phone',
        '',
      'contact_method',
        order_row.contact_method,
      'contact_value',
        order_row.contact_value,
      'customer_notes',
        order_row.customer_notes,
      'status',
        order_row.status,
      'customer_approval_status',
        order_row.customer_approval_status,
      'revision_message',
        order_row.revision_message,
      'admin_notes',
        '',
      'submitted_at',
        order_row.submitted_at,
      'updated_at',
        order_row.updated_at,
      'order_items',
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id',
                  item.id,
                'order_id',
                  item.order_id,
                'product_id',
                  item.product_id,
                'display_name',
                  item.display_name,
                'category_slug',
                  item.category_slug,
                'category_name',
                  item.category_name,
                'image_number',
                  item.image_number,
                'source_filename',
                  item.source_filename,
                'thumbnail_url',
                  item.thumbnail_url,
                'full_image_url',
                  item.full_image_url,
                'requested_quantity',
                  item.requested_quantity,
                'approved_quantity',
                  item.approved_quantity,
                'is_available',
                  item.is_available,
                'admin_note',
                  item.admin_note,
                'created_at',
                  item.created_at,
                'updated_at',
                  item.updated_at
              )
              order by item.created_at
            )
            from public.order_items
              as item
            where item.order_id =
              order_row.id
          ),
          '[]'::jsonb
        )
    )
  into v_result
  from public.orders
    as order_row
  where order_row.id =
      p_order_id
    and order_row.portal_token_hash =
      v_token_hash;

  return v_result;
end;
$$;

revoke all on function
  public.get_order_by_access_token(
    uuid,
    text
  )
from public;

grant execute on function
  public.get_order_by_access_token(
    uuid,
    text
  )
to anon, authenticated;

notify pgrst, 'reload schema';
