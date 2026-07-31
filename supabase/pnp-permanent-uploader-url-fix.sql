
begin;

create or replace function public.pnp_public_image_url_from_key(
  object_key text
)
returns text
language plpgsql
immutable
strict
as $function$
declare
  encoded_key text;
begin
  encoded_key := trim(both '/' from object_key);

  -- The uploader-generated keys contain safe folders plus filenames whose
  -- spaces and parentheses need URL encoding.
  encoded_key := replace(encoded_key, '%', '%25');
  encoded_key := replace(encoded_key, ' ', '%20');
  encoded_key := replace(encoded_key, '(', '%28');
  encoded_key := replace(encoded_key, ')', '%29');
  encoded_key := replace(encoded_key, '#', '%23');
  encoded_key := replace(encoded_key, '?', '%3F');
  encoded_key := replace(encoded_key, '&', '%26');
  encoded_key := replace(encoded_key, '+', '%2B');
  encoded_key := replace(encoded_key, '''', '%27');

  return
    'https://images.pressedinpink.com/'
    || encoded_key;
end;
$function$;

create or replace function public.pnp_set_catalog_wrap_urls()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if nullif(trim(new.r2_thumbnail_key), '') is not null then
    new.thumbnail_url :=
      public.pnp_public_image_url_from_key(
        new.r2_thumbnail_key
      );
  end if;

  if nullif(trim(new.r2_original_key), '') is not null then
    new.full_image_url :=
      public.pnp_public_image_url_from_key(
        new.r2_original_key
      );
  end if;

  return new;
end;
$function$;

drop trigger if exists
  catalog_wraps_force_public_urls
on public.catalog_wraps;

create trigger catalog_wraps_force_public_urls
before insert or update of
  r2_thumbnail_key,
  r2_original_key,
  thumbnail_url,
  full_image_url
on public.catalog_wraps
for each row
execute function public.pnp_set_catalog_wrap_urls();

create or replace function public.pnp_normalize_category_card_url()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  object_key text;
begin
  if new.card_image_url is null
    or trim(new.card_image_url) = ''
  then
    return new;
  end if;

  if new.card_image_url ~*
    '^https?://images\.pressedinpink\.com/'
  then
    object_key := regexp_replace(
      new.card_image_url,
      '^https?://images\.pressedinpink\.com/+',
      '',
      'i'
    );

    -- Decode the characters used by uploader filenames before rebuilding.
    object_key := replace(object_key, '%20', ' ');
    object_key := replace(object_key, '%28', '(');
    object_key := replace(object_key, '%29', ')');
    object_key := replace(object_key, '%23', '#');
    object_key := replace(object_key, '%3F', '?');
    object_key := replace(object_key, '%26', '&');
    object_key := replace(object_key, '%2B', '+');
    object_key := replace(object_key, '%27', '''');
    object_key := replace(object_key, '%25', '%');

    -- Repair a base URL that was mistakenly configured with /wraps.
    object_key := regexp_replace(
      object_key,
      '^(wraps/)+',
      'wraps/',
      'i'
    );

    new.card_image_url :=
      public.pnp_public_image_url_from_key(
        object_key
      );
  end if;

  return new;
end;
$function$;

drop trigger if exists
  catalog_categories_normalize_card_url
on public.catalog_categories;

create trigger catalog_categories_normalize_card_url
before insert or update of card_image_url
on public.catalog_categories
for each row
execute function public.pnp_normalize_category_card_url();

-- Repair all existing uploaded wrap records from their authoritative R2 keys.
update public.catalog_wraps
set
  thumbnail_url = thumbnail_url,
  full_image_url = full_image_url
where
  nullif(trim(r2_thumbnail_key), '') is not null
  or nullif(trim(r2_original_key), '') is not null;

-- Repair existing R2-backed category-card URLs.
update public.catalog_categories
set card_image_url = card_image_url
where card_image_url ~*
  '^https?://images\.pressedinpink\.com/';

notify pgrst, 'reload schema';

commit;

-- Verification
select
  category.slug,
  count(wrap.id) as wrap_count,
  count(*) filter (
    where wrap.thumbnail_url like
      'https://images.pressedinpink.com/wraps/%'
  ) as canonical_thumbnail_count
from public.catalog_categories as category
left join public.catalog_wraps as wrap
  on wrap.category_id = category.id
where category.slug in (
  'alice-in-wonderland',
  'princesses'
)
group by category.slug
order by category.slug;
