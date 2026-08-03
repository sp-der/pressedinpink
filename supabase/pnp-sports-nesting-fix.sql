-- PNP SPORTS NESTING REPAIR
-- Run this in Supabase Dashboard > SQL Editor.
-- Safe to run more than once.

alter table public.catalog_categories
  add column if not exists parent_slug text null;

create index if not exists catalog_categories_parent_slug_idx
  on public.catalog_categories (parent_slug, display_order, display_name);

-- Original Sports teams.
update public.catalog_categories
set parent_slug = 'sports',
    updated_at = now()
where slug in (
  'dodgers',
  'lakers',
  'clippers',
  'celtics',
  'goldenstate',
  'nuggets',
  'bulls'
);

-- Move the two already-uploaded NFL categories into Sports.
update public.catalog_categories
set parent_slug = 'sports',
    updated_at = now()
where slug in (
    'san-francisco-49ers',
    'sanfrancisco49ers',
    '49ers',
    'los-angeles-rams',
    'losangelesrams',
    'rams'
  )
   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') in (
    'sanfrancisco49ers',
    'losangelesrams'
  );

-- Slightly zoom the Rams card logo.
update public.catalog_categories
set image_scale = 'scale-[1.18]',
    updated_at = now()
where slug in ('los-angeles-rams', 'losangelesrams', 'rams')
   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') =
      'losangelesrams';

-- Sports itself remains a top-level category.
update public.catalog_categories
set parent_slug = null,
    updated_at = now()
where slug = 'sports';
