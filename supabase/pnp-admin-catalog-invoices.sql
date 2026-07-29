-- PRESSED IN PINK ADMIN CATALOG + INVOICE UPDATE
-- Run this file once in Supabase Dashboard > SQL Editor.
-- It is safe to run again after future updates.

create extension if not exists pgcrypto;

create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  heading text not null,
  item_label text not null,
  filename_prefix text not null,
  image_folder text not null unique,
  description text not null default '',
  keywords text not null default '',
  card_image_url text not null default '',
  image_scale text not null default 'scale-100',
  base_image_count integer not null default 0
    check (base_image_count >= 0),
  display_order integer not null default 1000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_wraps (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null
    references public.catalog_categories(id)
    on delete cascade,
  image_number integer not null
    check (image_number > 0),
  display_name text not null,
  source_filename text not null,
  thumbnail_url text not null,
  full_image_url text not null,
  r2_original_key text not null unique,
  r2_thumbnail_key text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, image_number)
);

create sequence if not exists public.invoice_number_seq start 1;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default (
    'PNP-INV-'
    || to_char(now(), 'YYYY')
    || '-'
    || lpad(nextval('public.invoice_number_seq')::text, 6, '0')
  ),
  order_id uuid not null unique
    references public.orders(id)
    on delete cascade,
  customer_name text not null,
  customer_email text not null,
  subtotal numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  created_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null
    references public.invoices(id)
    on delete cascade,
  order_item_id uuid
    references public.order_items(id)
    on delete set null,
  description text not null,
  quantity integer not null check (quantity between 0 and 999),
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists catalog_categories_order_idx
  on public.catalog_categories(display_order, display_name);
create index if not exists catalog_wraps_category_idx
  on public.catalog_wraps(category_id, image_number);
create index if not exists invoices_order_idx
  on public.invoices(order_id);
create index if not exists invoice_items_invoice_idx
  on public.invoice_items(invoice_id);

create or replace function public.set_pnp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_categories_set_updated_at
  on public.catalog_categories;
create trigger catalog_categories_set_updated_at
before update on public.catalog_categories
for each row execute function public.set_pnp_updated_at();

drop trigger if exists catalog_wraps_set_updated_at
  on public.catalog_wraps;
create trigger catalog_wraps_set_updated_at
before update on public.catalog_wraps
for each row execute function public.set_pnp_updated_at();

drop trigger if exists invoices_set_updated_at
  on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_pnp_updated_at();

alter table public.catalog_categories enable row level security;
alter table public.catalog_wraps enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "Public active catalog categories"
  on public.catalog_categories;
create policy "Public active catalog categories"
on public.catalog_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage catalog categories"
  on public.catalog_categories;
create policy "Admins manage catalog categories"
on public.catalog_categories
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Public active catalog wraps"
  on public.catalog_wraps;
create policy "Public active catalog wraps"
on public.catalog_wraps
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.catalog_categories categories
    where categories.id = catalog_wraps.category_id
      and categories.is_active = true
  )
);

drop policy if exists "Admins manage catalog wraps"
  on public.catalog_wraps;
create policy "Admins manage catalog wraps"
on public.catalog_wraps
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins manage invoices"
  on public.invoices;
create policy "Admins manage invoices"
on public.invoices
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Customers read own invoices"
  on public.invoices;
create policy "Customers read own invoices"
on public.invoices
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = invoices.order_id
      and orders.customer_id = (select auth.uid())
  )
);

drop policy if exists "Admins manage invoice items"
  on public.invoice_items;
create policy "Admins manage invoice items"
on public.invoice_items
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Customers read own invoice items"
  on public.invoice_items;
create policy "Customers read own invoice items"
on public.invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.invoices
    join public.orders on orders.id = invoices.order_id
    where invoices.id = invoice_items.invoice_id
      and orders.customer_id = (select auth.uid())
  )
);

grant select on public.catalog_categories to anon, authenticated;
grant select on public.catalog_wraps to anon, authenticated;
grant insert, update, delete on public.catalog_categories to authenticated;
grant insert, update, delete on public.catalog_wraps to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant usage, select on sequence public.invoice_number_seq to authenticated;

insert into public.catalog_categories (
  slug,
  display_name,
  heading,
  item_label,
  filename_prefix,
  image_folder,
  description,
  keywords,
  image_scale,
  base_image_count,
  display_order
)
values
  ('90scartoons', '90s Cartoons', '90s Cartoons Wraps', '90s Cartoons', '90scartoons', '90scartoons', 'Browse nostalgic designs inspired by classic cartoons and characters.', '90s cartoons retro nostalgic Nickelodeon Cartoon Network characters', 'scale-[1.65]', 116, 10),
  ('sports', 'Sports', 'Sports Wraps', 'Sports', 'sports', 'sports', 'Browse team-inspired, game-day, and sports-themed UV-DTF wraps.', 'sports football basketball baseball soccer teams game day athletes', 'scale-[1.25]', 0, 20),
  ('hello-kitty', 'Hello Kitty and Friends', 'Hello Kitty and Friends Wraps', 'Hello Kitty', 'hellokitty', 'hellokitty', 'Browse Hello Kitty, Sanrio friends, and other cute character wrap designs.', 'Hello Kitty Sanrio friends cute kawaii pink characters Kuromi My Melody Cinnamoroll', 'scale-[1.25]', 292, 30),
  ('nightmare', 'Nightmare Before Christmas', 'Nightmare Before Christmas Wraps', 'Nightmare', 'nightmare', 'nightmare', 'Browse spooky, festive, and character-inspired Nightmare Before Christmas wraps.', 'Nightmare Before Christmas Jack Skellington Sally Zero Halloween Christmas spooky', 'scale-[1.2]', 48, 40),
  ('pooh', 'Winnie the Pooh & Friends', 'Winnie the Pooh & Friends Wraps', 'Pooh', 'pooh', 'pooh', 'Browse Winnie the Pooh, Tigger, Eeyore, Piglet, and friends.', 'Winnie the Pooh friends Tigger Eeyore Piglet honey bear Disney', 'scale-[1.2]', 95, 50),
  ('princesses', 'Princesses', 'Princess Wraps', 'Princess', 'princesses', 'princesses', 'Browse colorful princess-inspired wraps, characters, castles, and fairytale designs.', 'princess princesses fairytale castle royal crowns characters', 'scale-[1.15]', 0, 55),
  ('anime', 'Anime', 'Anime Wraps', 'Anime', 'Anime', 'anime', 'Browse anime-inspired characters, series, artwork, and colorful UV-DTF wraps.', 'anime manga Japanese series characters cartoons colorful', 'scale-100', 75, 60),
  ('kpop', 'K-Pop', 'K-Pop Wraps', 'K-Pop', 'Kpop', 'kpop', 'Browse K-pop-inspired groups, artists, albums, and fan-favorite UV-DTF wraps.', 'K-pop kpop Korean music groups idols artists albums', 'scale-[1.45]', 68, 70),
  ('labubu', 'Labubu', 'Labubu Wraps', 'Labubu', 'labubu', 'labubu', 'Browse playful Labubu-inspired characters, colors, and collectible-style designs.', 'Labubu Pop Mart monster collectible cute character toy', 'scale-[1.25]', 84, 80),
  ('music', 'Music', 'Music Wraps', 'Music', 'Music', 'music', 'Browse music-inspired artists, albums, lyrics, and fan-favorite designs.', 'music musicians artists singers rappers albums lyrics bands concerts', 'scale-[1.25]', 75, 90),
  ('420', '420', '420 Wraps', '420', '420', '420', 'Browse bold, colorful, and laid-back 420-inspired wrap designs.', '420 cannabis weed marijuana smoke smoking green stoner', 'scale-[1.25]', 15, 100),
  ('villians', 'Villains', 'Villains Wraps', 'Villains', 'villians', 'villains', 'Browse bold villain-inspired wrap designs.', 'villains evil characters dark Disney', 'scale-100', 34, 110),
  ('dodgers', 'Los Angeles Dodgers', 'Los Angeles Dodgers Wraps', 'Dodgers', 'dodgers', 'dodgers', 'Browse Los Angeles Dodgers wraps.', 'Dodgers baseball Los Angeles sports', 'scale-100', 83, 200),
  ('lakers', 'Los Angeles Lakers', 'Los Angeles Lakers Wraps', 'Lakers', 'lakers', 'lakers', 'Browse Los Angeles Lakers wraps.', 'Lakers basketball Los Angeles sports', 'scale-100', 14, 210),
  ('clippers', 'Los Angeles Clippers', 'Los Angeles Clippers Wraps', 'Clippers', 'clippers', 'clippers', 'Browse Los Angeles Clippers wraps.', 'Clippers basketball Los Angeles sports', 'scale-100', 5, 220),
  ('celtics', 'Boston Celtics', 'Boston Celtics Wraps', 'Celtics', 'celtics', 'celtics', 'Browse Boston Celtics wraps.', 'Celtics basketball Boston sports', 'scale-100', 1, 230),
  ('goldenstate', 'Golden State Warriors', 'Golden State Warriors Wraps', 'Golden State', 'goldenstate', 'goldenstate', 'Browse Golden State Warriors wraps.', 'Warriors basketball Golden State sports', 'scale-100', 7, 240),
  ('nuggets', 'Denver Nuggets', 'Denver Nuggets Wraps', 'Nuggets', 'nuggets', 'nuggets', 'Browse Denver Nuggets wraps.', 'Nuggets basketball Denver sports', 'scale-100', 1, 250),
  ('bulls', 'Chicago Bulls', 'Chicago Bulls Wraps', 'Bulls', 'bulls', 'bulls', 'Browse Chicago Bulls wraps.', 'Bulls basketball Chicago sports', 'scale-100', 5, 260)
on conflict (slug) do update set
  display_name = excluded.display_name,
  heading = excluded.heading,
  item_label = excluded.item_label,
  filename_prefix = excluded.filename_prefix,
  image_folder = excluded.image_folder,
  description = excluded.description,
  keywords = excluded.keywords,
  image_scale = excluded.image_scale,
  base_image_count = excluded.base_image_count,
  display_order = excluded.display_order,
  is_active = true;
