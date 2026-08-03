-- PRESSED IN PINK SPORTS SUBCATEGORY SUPPORT
-- Run once in Supabase Dashboard > SQL Editor.
-- Safe to run again.

alter table public.catalog_categories
add column if not exists parent_slug text;

-- Mark the existing hard-coded team categories as children of Sports.
update public.catalog_categories
set parent_slug = 'sports'
where slug in (
  'dodgers',
  'lakers',
  'clippers',
  'celtics',
  'goldenstate',
  'nuggets',
  'bulls'
);

-- Sports itself and normal wrap categories remain top-level.
update public.catalog_categories
set parent_slug = null
where slug = 'sports';

create index if not exists catalog_categories_parent_slug_idx
on public.catalog_categories(parent_slug, display_order, display_name);
