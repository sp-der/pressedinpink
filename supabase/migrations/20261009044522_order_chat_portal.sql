CREATE OR REPLACE FUNCTION public.get_order_by_access_token(p_order_id uuid, p_access_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
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
    and (order_row.portal_token_hash = v_token_hash or exists (select 1 from private.order_chat_tokens t where t.order_id=order_row.id and t.token_hash=v_token_hash));

  return v_result;
end;
$function$;
