-- Run in a SQL session. Everything rolls back; no auth accounts or emails are created.
begin;
do $$
declare
  v_customer uuid; v_order uuid := gen_random_uuid(); v_request uuid := gen_random_uuid();
  v_first public.order_messages; v_retry public.order_messages; v_count integer;
begin
  if has_table_privilege('anon','public.order_messages','SELECT')
    or has_table_privilege('authenticated','public.order_messages','INSERT')
    or has_function_privilege('authenticated','public.order_chat_portal_token(uuid,text)','EXECUTE')
    or has_function_privilege('anon','public.order_chat_insert(uuid,uuid,text,uuid,text,text)','EXECUTE') then
    raise exception 'Public chat access is exposed';
  end if;
  select id into v_customer from auth.users limit 1;
  if v_customer is null then raise exception 'Test requires an existing user'; end if;
  insert into public.orders(id,order_number,customer_id,checkout_type,customer_name,customer_email,customer_phone,contact_method,contact_value)
  values(v_order,'CHAT-ROLLBACK-'||v_order,v_customer,'guest','Rollback test','delivered@resend.dev','','email','delivered@resend.dev');
  select * into v_first from public.order_chat_insert(v_order,v_request,'customer',null,'Test customer','One message');
  select * into v_retry from public.order_chat_insert(v_order,v_request,'customer',null,'Test customer','One message');
  if v_first.id<>v_retry.id then raise exception 'Duplicate message created'; end if;
  begin
    perform public.order_chat_insert(v_order,v_request,'admin',null,'Pressed In Pink','Spoofed retry');
    raise exception 'Conflicting retry accepted';
  exception when raise_exception then
    if sqlerrm='Conflicting retry accepted' then raise; end if;
  end;
  update public.orders set revision_message='New revision' where id=v_order;
  update public.orders set revision_message='New revision',admin_notes='Private only' where id=v_order;
  select count(*) into v_count from public.order_messages where order_id=v_order;
  if v_count<>2 then raise exception 'Revision duplicated or private notes generated a message'; end if;
  select count(*) into v_count from public.order_message_notifications n join public.order_messages m on m.id=n.message_id where m.order_id=v_order;
  if v_count<>2 then raise exception 'Expected one notification per new message'; end if;
  select count(*) into v_count from public.order_chat_claim_notifications(v_order);
  if v_count<>2 then raise exception 'Expected two notification leases'; end if;
  select count(*) into v_count from public.order_chat_claim_notifications(v_order);
  if v_count<>0 then raise exception 'Active leases claimed twice'; end if;
end $$;
rollback;
