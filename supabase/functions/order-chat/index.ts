import { createClient } from 'npm:@supabase/supabase-js@2.110.8';
import { customerOwnsOrder, escapeHtml, messageBody, portalUrl, SITE_URL, UUID } from './logic.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-order-chat-worker', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const fields = 'id,order_id,sender_type,sender_name,message,created_at,customer_seen_at,admin_seen_at';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const db = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
type DB = ReturnType<typeof db>;

async function drain(client: DB, orderId: string | null = null) {
  const { data: jobs, error } = await client.rpc('order_chat_claim_notifications', { p_order_id: orderId });
  if (error) throw error;
  const results: { messageId: string; sent: boolean }[] = [];
  for (const job of jobs ?? []) {
    try {
      let payload = job.payload;
      if (!payload) {
        const { data: message, error: messageError } = await client.from('order_messages').select('*').eq('id', job.message_id).single();
        if (messageError) throw messageError;
        const { data: order, error: orderError } = await client.from('orders').select('id,order_number,customer_name,customer_email,checkout_type').eq('id', message.order_id).single();
        if (orderError) throw orderError;
        const toCustomer = message.sender_type === 'admin';
        const support = Deno.env.get('SUPPORT_EMAIL') ?? 'support@pressedinpink.com';
        let token = '';
        if (toCustomer && order.checkout_type === 'guest') {
          const tokenResult = await client.rpc('order_chat_portal_token', { p_order_id: order.id });
          if (tokenResult.error) throw tokenResult.error;
          token = tokenResult.data;
        }
        const link = toCustomer ? portalUrl(order.id, order.checkout_type, token) : `${SITE_URL}/admin/order/?order=${encodeURIComponent(order.id)}`;
        const subject = toCustomer ? `New message about your Pressed In Pink order ${order.order_number}` : `New customer message on PNP order ${order.order_number}`;
        const context = toCustomer ? 'Pressed In Pink sent you a message.' : `${order.customer_name} (${order.customer_email}) sent a message.`;
        const button = toCustomer ? 'View Order & Reply' : 'Open Order & Reply';
        payload = {
          from: Deno.env.get('FROM_EMAIL') ?? 'Pressed In Pink <support@pressedinpink.com>',
          to: [toCustomer ? order.customer_email : (Deno.env.get('PNP_NOTIFICATION_EMAIL') ?? support)],
          reply_to: toCustomer ? support : order.customer_email,
          subject,
          text: `${context}\nOrder ${order.order_number}\n\n${message.message}\n\n${button}: ${link}`,
          html: `<!doctype html><html lang="en"><body style="margin:0;background:#000;color:#fff;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;border:1px solid #7f1d1d;border-radius:24px;background:#090909"><tr><td style="padding:28px"><img src="${SITE_URL}/logo.png" alt="Pressed In Pink" width="150" /><h1 style="font-size:24px">Order ${escapeHtml(order.order_number)}</h1><p>${escapeHtml(context)}</p><div style="white-space:pre-wrap;overflow-wrap:anywhere;padding:20px;background:#18181b;border-radius:16px;line-height:1.7">${escapeHtml(message.message)}</div><p style="margin-top:28px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#dc2626;border-radius:30px;padding:14px 24px;color:#fff;font-weight:bold;text-decoration:none">${escapeHtml(button)}</a></p><p style="font-size:12px;color:#d4d4d8">Reply securely through your order conversation.</p></td></tr></table></td></tr></table></body></html>`,
        };
        const saved = await client.from('order_message_notifications').update({ payload }).eq('message_id', job.message_id).eq('lease_id', job.lease_id);
        if (saved.error) throw saved.error;
      }
      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `pnp-chat-${job.message_id}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
      const result = await response.json();
      if (!response.ok) throw new Error(`Resend ${response.status}: ${result.message ?? 'Email rejected'}`);
      const saved = await client.from('order_message_notifications').update({ state: 'sent', provider_id: result.id, sent_at: new Date().toISOString(), lease_until: null, last_error: null }).eq('message_id', job.message_id).eq('lease_id', job.lease_id);
      if (saved.error) throw saved.error;
      results.push({ messageId: job.message_id, sent: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Notification failed';
      console.error('Order chat notification failed', { messageId: job.message_id, detail });
      const saved = await client.from('order_message_notifications').update({ state: 'pending', last_error: detail, lease_until: null, next_attempt_at: new Date(Date.now() + Math.min(60 * 60, 15 * 2 ** Math.min(job.attempts, 8)) * 1000).toISOString() }).eq('message_id', job.message_id).eq('lease_id', job.lease_id);
      if (saved.error) console.error('Notification recovery update failed', { messageId: job.message_id, code: saved.error.code });
      results.push({ messageId: job.message_id, sent: false });
    }
  }
  return results;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    const text = await request.text();
    if (text.length > 12000) return json({ error: 'Request too large.' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: 'Invalid request body.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request body.' }, 400);
    const client = db();
    if (body.action === 'worker') {
      const { data: allowed, error } = await client.rpc('order_chat_worker_authorized', { p_key: request.headers.get('x-order-chat-worker') ?? '' });
      if (error || !allowed) return json({ error: 'Unauthorized.' }, 401);
      return json({ results: await drain(client) });
    }
    // Auth API validates signatures and live users. Never decode or trust client claims.
    const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    let user = null;
    if (bearer) {
      const { data, error } = await client.auth.getUser(bearer);
      if (!error) user = data.user;
    }
    let admin = false;
    if (user && !user.is_anonymous) {
      const { data: profile, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (error) throw error;
      admin = profile?.role === 'admin';
    }
    if (body.action === 'unread') {
      if (!admin) return json({ error: 'Access denied.' }, 403);
      const { data, error } = await client.from('order_messages').select('order_id').eq('sender_type', 'customer').is('admin_seen_at', null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) counts[row.order_id] = (counts[row.order_id] ?? 0) + 1;
      return json({ counts });
    }
    if (typeof body.orderId !== 'string' || !UUID.test(body.orderId)) return json({ error: 'Invalid order.' }, 400);
    const { data: order, error: orderError } = await client.from('orders').select('id,customer_id,checkout_type,customer_name').eq('id', body.orderId).maybeSingle();
    if (orderError) throw orderError;
    let guest = false;
    if (order && !admin && typeof body.accessToken === 'string' && body.accessToken.length >= 32 && body.accessToken.length <= 256) {
      const { data, error } = await client.rpc('get_order_by_access_token', { p_order_id: order.id, p_access_token: body.accessToken });
      if (error) throw error;
      guest = Boolean(data);
      if (guest && order.checkout_type === 'guest') {
        // Capture the original token if this old order has no saved notification link yet.
        const captured = await client.rpc('order_chat_portal_token', { p_order_id: order.id, p_access_token: body.accessToken });
        if (captured.error) throw captured.error;
      }
    }
    if (!order || (!admin && !guest && !customerOwnsOrder(user, order))) return json({ error: 'Access denied.' }, 403);
    const actor = admin ? 'admin' : 'customer';
    if (body.action === 'send') {
      let message;
      try { message = messageBody(body.message); } catch (error) { return json({ error: (error as Error).message }, 400); }
      if (typeof body.requestId !== 'string' || !UUID.test(body.requestId)) return json({ error: 'A request ID is required.' }, 400);
      const { data: saved, error } = await client.rpc('order_chat_insert', { p_order_id: order.id, p_request_id: body.requestId, p_sender_type: actor,
        p_sender_user_id: admin || customerOwnsOrder(user, order) ? user!.id : null,
        p_sender_name: admin ? 'Pressed In Pink' : order.customer_name, p_message: message });
      if (error) return json({ error: error.message }, error.message.includes('Too many') ? 429 : 409);
      // Notification failure must never discard an already committed message.
      try { await drain(client, order.id); } catch (error) { console.error('Notification drain failed', { orderId: order.id, error: String(error) }); }
      const { data: notification } = await client.from('order_message_notifications').select('state').eq('message_id', saved.id).maybeSingle();
      const safeMessage = Object.fromEntries(fields.split(',').map(key => [key, saved[key]]));
      return json({ message: safeMessage, notification: notification?.state ?? 'pending' });
    }
    if (body.action === 'list') {
      const offset = body.offset ?? 0;
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return json({ error: 'Invalid page.' }, 400);
      const { data, error } = await client.from('order_messages').select(fields).eq('order_id', order.id).order('created_at').order('id').range(offset, offset + 199);
      if (error) throw error;
      return json({ messages: data });
    }
    if (body.action === 'seen') {
      if (!Array.isArray(body.messageIds) || body.messageIds.length > 10000 || body.messageIds.some((id: unknown) => typeof id !== 'string' || !UUID.test(id))) return json({ error: 'Invalid messages.' }, 400);
      const column = admin ? 'admin_seen_at' : 'customer_seen_at';
      if (body.messageIds.length) {
        const { error } = await client.from('order_messages').update({ [column]: new Date().toISOString() }).eq('order_id', order.id).neq('sender_type', actor).is(column, null).in('id', body.messageIds);
        if (error) throw error;
      }
      return json({ seen: true });
    }
    if (body.action === 'notifications' && admin) {
      const { data, error } = await client.from('order_message_notifications').select('message_id,state,last_error,attempts,order_messages!inner(order_id)').eq('order_messages.order_id', order.id).neq('state', 'sent');
      if (error) throw error;
      return json({ notifications: data });
    }
    if (body.action === 'retry' && admin) return json({ results: await drain(client, order.id) });
    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    console.error('Order chat request failed', { error: String(error) });
    return json({ error: 'The conversation could not be loaded. Please try again.' }, 500);
  }
});
