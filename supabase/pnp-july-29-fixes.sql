-- PRESSED IN PINK JULY 29 FIXES
-- Safe to run more than once in Supabase Dashboard > SQL Editor.
-- This keeps the Princesses category connected to its new category image.

update public.catalog_categories
set
  card_image_url = '/wrap-categories/princesses.png',
  image_scale = 'scale-[1.1]',
  description = 'Browse colorful princess-inspired characters, castles, crowns, and fairytale designs.',
  keywords = 'princess princesses fairytale castle royal crowns characters',
  updated_at = now()
where slug = 'princesses';

-- Confirm the record after the update.
select
  slug,
  display_name,
  card_image_url,
  base_image_count,
  is_active
from public.catalog_categories
where slug = 'princesses';
