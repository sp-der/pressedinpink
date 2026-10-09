-- Order chat is accessed only through the server-authenticated Edge Function.
create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_type text not null check (sender_type in ('admin','customer')),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  customer_seen_at timestamptz,
  admin_seen_at timestamptz,
  unique(order_id, request_id)
);
create index order_messages_thread on public.order_messages(order_id,created_at,id);
create index order_messages_admin_unread on public.order_messages(order_id) where sender_type='customer' and admin_seen_at is null;
alter table public.order_messages enable row level security;
revoke all on public.order_messages from public,anon,authenticated;
grant all on public.order_messages to service_role;

create table public.order_message_notifications (
  message_id uuid primary key references public.order_messages(id) on delete cascade,
  state text not null default 'pending' check(state in ('pending','sending','sent','needs_review')),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  lease_id uuid,
  lease_until timestamptz,
  payload jsonb,
  provider_id text,
  last_error text,
  sent_at timestamptz
);
create index order_message_notifications_pending on public.order_message_notifications(next_attempt_at) where state in ('pending','sending');
alter table public.order_message_notifications enable row level security;
revoke all on public.order_message_notifications from public,anon,authenticated;
grant all on public.order_message_notifications to service_role;

create table private.order_chat_tokens (
  order_id uuid primary key references public.orders(id) on delete cascade,
  encrypted_token bytea not null,
  token_hash text not null
);
alter table private.order_chat_tokens enable row level security;
revoke all on private.order_chat_tokens from public,anon,authenticated;
-- Encryption key and worker credential stay in Vault and never leave privileged code.
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'order_chat_encryption_key');
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'order_chat_worker_key');

create function public.order_chat_portal_token(p_order_id uuid, p_access_token text default null)
returns text language plpgsql security definer set search_path=public,private,extensions,pg_temp as $$
declare v_order public.orders; v_token text; v_key text;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order unavailable'; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name='order_chat_encryption_key';
  select pgp_sym_decrypt(encrypted_token,v_key) into v_token from private.order_chat_tokens where order_id=p_order_id;
  if v_token is not null then return v_token; end if;
  if p_access_token is not null then
    if encode(digest(p_access_token,'sha256'),'hex') is distinct from v_order.portal_token_hash then
      raise exception 'Invalid private token';
    end if;
    v_token := p_access_token;
  else
    v_token := encode(gen_random_bytes(32),'hex');
  end if;
  insert into private.order_chat_tokens values(p_order_id,pgp_sym_encrypt(v_token,v_key,'cipher-algo=aes256'),encode(digest(v_token,'sha256'),'hex'));
  return v_token;
end $$;
revoke all on function public.order_chat_portal_token(uuid,text) from public,anon,authenticated;
grant execute on function public.order_chat_portal_token(uuid,text) to service_role;

create function public.order_chat_worker_authorized(p_key text)
returns boolean language sql security definer set search_path=pg_catalog,pg_temp as $$
  select exists(select 1 from vault.decrypted_secrets where name='order_chat_worker_key' and decrypted_secret=p_key and char_length(p_key)=64)
$$;
revoke all on function public.order_chat_worker_authorized(text) from public,anon,authenticated;
grant execute on function public.order_chat_worker_authorized(text) to service_role;

create function private.queue_order_message()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.order_message_notifications(message_id) values(new.id);
  return new;
end $$;
revoke all on function private.queue_order_message() from public,anon,authenticated;
-- Backfill historical revisions without emailing old messages.
insert into public.order_messages(order_id,sender_type,sender_name,message,request_id,created_at,admin_seen_at)
select id,'admin','Pressed In Pink',left(btrim(revision_message),4000),gen_random_uuid(),updated_at,updated_at
from public.orders where nullif(btrim(revision_message),'') is not null;
create trigger queue_order_message after insert on public.order_messages for each row execute function private.queue_order_message();

create function private.revision_to_order_chat()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $$
begin
  if nullif(btrim(new.revision_message),'') is not null
     and btrim(new.revision_message) is distinct from btrim(old.revision_message) then
    -- RLS already checks admin updates; also protect privileged update paths.
    if auth.uid() is not null and not private.is_admin() then raise exception 'Only admins can send revisions'; end if;
    insert into public.order_messages(order_id,sender_type,sender_user_id,sender_name,message,request_id,admin_seen_at)
    values(new.id,'admin',auth.uid(),'Pressed In Pink',btrim(new.revision_message),gen_random_uuid(),now());
  end if;
  return new;
end $$;
revoke all on function private.revision_to_order_chat() from public,anon,authenticated;
create trigger revision_to_order_chat after update of revision_message on public.orders for each row execute function private.revision_to_order_chat();

-- Called only after Edge Function validates admin, owner, or private token.
-- A row lock serializes retries and the per-order rate limit.
create function public.order_chat_insert(p_order_id uuid,p_request_id uuid,p_sender_type text,p_sender_user_id uuid,p_sender_name text,p_message text)
returns public.order_messages language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_existing public.order_messages; v_message public.order_messages;
begin
  perform 1 from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order unavailable'; end if;
  select * into v_existing from public.order_messages where order_id=p_order_id and request_id=p_request_id;
  if found then
    if v_existing.sender_type<>p_sender_type or v_existing.sender_user_id is distinct from p_sender_user_id or v_existing.message<>p_message then
      raise exception 'Request ID already used with a different message';
    end if;
    return v_existing;
  end if;
  if (select count(*) from public.order_messages where order_id=p_order_id and sender_type=p_sender_type and created_at>now()-interval '1 minute') >= 20 then
    raise exception 'Too many messages. Please wait a minute.';
  end if;
  insert into public.order_messages(order_id,request_id,sender_type,sender_user_id,sender_name,message,admin_seen_at,customer_seen_at)
  values(p_order_id,p_request_id,p_sender_type,p_sender_user_id,p_sender_name,p_message,
    case when p_sender_type='admin' then now() end,case when p_sender_type='customer' then now() end)
  returning * into v_message;
  return v_message;
end $$;
revoke all on function public.order_chat_insert(uuid,uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.order_chat_insert(uuid,uuid,text,uuid,text,text) to service_role;

create function public.order_chat_claim_notifications(p_order_id uuid default null)
returns setof public.order_message_notifications language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  -- Resend idempotency expires after 24 hours. Ambiguous deliveries must be
  -- reconciled manually rather than resent after that window.
  update public.order_message_notifications set state='needs_review',last_error='Retry window expired; reconcile provider delivery before resending.'
  where state in ('pending','sending') and first_attempt_at < now()-interval '23 hours' and (lease_until is null or lease_until<now());
  return query
  update public.order_message_notifications n set state='sending',lease_id=gen_random_uuid(),lease_until=now()+interval '1 minute',
    first_attempt_at=coalesce(n.first_attempt_at,now()),attempts=n.attempts+1
  where n.message_id in (
    select q.message_id from public.order_message_notifications q join public.order_messages m on m.id=q.message_id
    where (p_order_id is null or m.order_id=p_order_id) and q.state in ('pending','sending')
      and q.next_attempt_at<=now() and (q.lease_until is null or q.lease_until<now())
    order by q.next_attempt_at limit 10 for update of q skip locked
  ) returning n.*;
end $$;
revoke all on function public.order_chat_claim_notifications(uuid) from public,anon,authenticated;
grant execute on function public.order_chat_claim_notifications(uuid) to service_role;

-- The queue survives closed browsers and provider outages.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.schedule('order-chat-notifications','* * * * *', $cron$
  select net.http_post(
    url := 'https://isqywuhhkclnonvdfwsd.supabase.co/functions/v1/order-chat',
    headers := jsonb_build_object('Content-Type','application/json','x-order-chat-worker',
      (select decrypted_secret from vault.decrypted_secrets where name='order_chat_worker_key')),
    body := '{"action":"worker"}'::jsonb,
    timeout_milliseconds := 60000
  ) where exists(select 1 from public.order_message_notifications where state in ('pending','sending') and next_attempt_at<=now());
$cron$);
