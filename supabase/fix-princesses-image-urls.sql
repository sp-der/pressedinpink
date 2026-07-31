-- Repair the existing Princesses catalog image URLs.
-- Run this once in the Supabase SQL Editor after confirming the objects
-- exist in R2 under wraps/princesses/originals and thumbnails.

begin;

update public.catalog_wraps as wrap
set
  thumbnail_url =
    'https://images.pressedinpink.com/' ||
    replace(wrap.r2_thumbnail_key, ' ', '%20'),
  full_image_url =
    'https://images.pressedinpink.com/' ||
    replace(wrap.r2_original_key, ' ', '%20'),
  updated_at = now()
from public.catalog_categories as category
where wrap.category_id = category.id
  and category.slug = 'princesses';

update public.catalog_categories as category
set
  card_image_url = coalesce(
    (
      select wrap.thumbnail_url
      from public.catalog_wraps as wrap
      where wrap.category_id = category.id
        and wrap.is_active = true
      order by wrap.image_number asc
      limit 1
    ),
    '/wrap-categories/princesses.png'
  ),
  updated_at = now()
where category.slug = 'princesses';

commit;

-- Verification result: should show 30 rows now, then increase as more are uploaded.
select
  category.display_name,
  count(wrap.id) as published_wraps,
  min(wrap.thumbnail_url) as sample_thumbnail_url,
  min(wrap.full_image_url) as sample_full_image_url
from public.catalog_categories as category
left join public.catalog_wraps as wrap
  on wrap.category_id = category.id
where category.slug = 'princesses'
group by category.display_name;
