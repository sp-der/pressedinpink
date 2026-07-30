begin;

-- Prevent orders from being inserted while existing numbers are reorganized.
lock table public.orders in exclusive mode;

-- Create the permanent sequence used for new customer order numbers.
create sequence if not exists public.order_number_seq
  start with 1
  increment by 1
  minvalue 1;

-- Assign every existing order a number based on submission date.
-- The oldest order becomes #001.
create temporary table pnp_order_number_map
on commit drop
as
select
  orders.id,
  row_number() over (
    order by
      orders.submitted_at asc nulls first,
      orders.id asc
  )::bigint as new_number
from public.orders as orders;

-- Temporarily move existing order numbers out of the way.
-- These values are unique and short enough for the order_number column.
update public.orders as orders
set order_number =
  'TMP-'
  || lpad(
    mapping.new_number::text,
    10,
    '0'
  )
from pnp_order_number_map as mapping
where orders.id = mapping.id;

-- Apply the final customer-facing numbers.
update public.orders as orders
set order_number =
  '#'
  || case
    when mapping.new_number < 1000 then
      lpad(
        mapping.new_number::text,
        3,
        '0'
      )
    else
      mapping.new_number::text
  end
from pnp_order_number_map as mapping
where orders.id = mapping.id;

-- Continue the sequence after the newest existing order.
-- With no existing orders, the first new order will receive #001.
select setval(
  'public.order_number_seq',
  coalesce(
    max(mapping.new_number),
    1
  ),
  count(*) > 0
)
from pnp_order_number_map as mapping;

-- This trigger function assigns the number to every new order.
-- It overrides the older number generated inside submit_order().
create or replace function public.assign_customer_order_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  generated_number bigint;
begin
  generated_number :=
    nextval(
      'public.order_number_seq'
    );

  new.order_number :=
    '#'
    || case
      when generated_number < 1000 then
        lpad(
          generated_number::text,
          3,
          '0'
        )
      else
        generated_number::text
    end;

  return new;
end;
$function$;

-- Replace only our dedicated order-number trigger if it already exists.
drop trigger if exists orders_assign_customer_number
on public.orders;

create trigger orders_assign_customer_number
before insert
on public.orders
for each row
execute function public.assign_customer_order_number();

notify pgrst, 'reload schema';

commit;