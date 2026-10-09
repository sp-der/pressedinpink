'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { orderChat, OrderMessage } from '@/lib/orderChat';

type Notification = { message_id: string; state: string; last_error: string | null };

export default function OrderConversation({ orderId, accessToken = '', admin = false, refreshKey = '' }: {
  orderId: string; accessToken?: string; admin?: boolean; refreshKey?: string;
}) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const pending = useRef<{ requestId: string; message: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const actor = admin ? 'admin' : 'customer';

  const load = useCallback(async () => {
    if (busy.current || document.visibilityState !== 'visible') return;
    busy.current = true;
    try {
      const all: OrderMessage[] = [];
      for (let offset = 0; ; offset += 200) {
        const result = await orderChat<{ messages: OrderMessage[] }>({ action: 'list', orderId, accessToken, offset });
        all.push(...result.messages);
        if (result.messages.length < 200) break;
      }
      if (!mounted.current) return;
      const atBottom = !list.current || list.current.scrollHeight - list.current.scrollTop - list.current.clientHeight < 80;
      setMessages(all);
      setLoaded(true);
      setError('');
      const unseen = all.filter(message => message.sender_type !== actor && !(admin ? message.admin_seen_at : message.customer_seen_at));
      if (unseen.length) setNewIds(current => new Set([...Array.from(current), ...unseen.map(message => message.id)]));
      // Only mark messages actually displayed while the conversation is on screen.
      const bounds = list.current?.getBoundingClientRect();
      if (unseen.length && bounds && bounds.top < window.innerHeight && bounds.bottom > 0) {
        await orderChat({ action: 'seen', orderId, accessToken, messageIds: unseen.map(message => message.id) });
      }
      if (admin) {
        const result = await orderChat<{ notifications: Notification[] }>({ action: 'notifications', orderId });
        if (mounted.current) setNotifications(result.notifications);
      }
      if (atBottom) requestAnimationFrame(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; });
    } catch (error) {
      if (mounted.current) setError(error instanceof Error ? error.message : 'Conversation unavailable.');
    } finally { busy.current = false; }
  }, [orderId, accessToken, admin, actor]);

  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    const visible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', visible);
    return () => { mounted.current = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [load, refreshKey]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true); setError(''); setNotice('');
    // Retain this ID after uncertain network failures. Editing is locked until
    // that same message is confirmed, so retries cannot create another message.
    if (!pending.current) pending.current = { requestId: crypto.randomUUID(), message: draft.trim() };
    try {
      const result = await orderChat<{ message: OrderMessage; notification: string }>({ action: 'send', orderId, accessToken, ...pending.current });
      pending.current = null; setDraft('');
      setMessages(current => current.some(message => message.id === result.message.id) ? current : [...current, result.message]);
      setNotice(result.notification === 'sent' ? 'Message sent.' : 'Message saved. Email notification is queued.');
      requestAnimationFrame(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; });
      await load();
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status && [400, 401, 403, 409, 429].includes(status)) pending.current = null;
      setError(error instanceof Error ? error.message : 'Message could not be sent. Retry the same message.');
    }
    finally { setSending(false); }
  };

  return <section aria-label="Order conversation" className="mt-6 rounded-3xl border border-red-900 bg-black/90 p-5 shadow-xl sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-black">Order Conversation</h2>
      <span className="text-xs text-white/60">{admin ? 'Chat with your customer' : 'Chat with Pressed In Pink'}</span>
    </div>
    <p className="mt-2 text-sm text-white/65">Messages stay with this order. New messages also send an email notification.</p>
    <div ref={list} role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" className="mt-5 max-h-[28rem] min-h-[8rem] space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      {!loaded && <p className="p-4 text-sm text-white/60">Loading conversation…</p>}
      {loaded && messages.length === 0 && <p className="p-4 text-sm text-white/60">No messages yet. Start the conversation below.</p>}
      {messages.map(message => {
        const own = message.sender_type === actor;
        return <article key={message.id} className={`w-fit max-w-[94%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${own ? 'ml-auto border border-red-800 bg-red-950/70' : 'border border-white/15 bg-zinc-900'}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs"><strong className={own ? 'text-red-100' : 'text-white'}>{message.sender_name}</strong>
            {newIds.has(message.id) && <span className="rounded-full bg-red-600 px-2 py-0.5 font-bold">New</span>}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/90 [overflow-wrap:anywhere]">{message.message}</p>
          <p className="mt-2 text-[11px] text-white/55"><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>{own && (admin ? message.customer_seen_at : message.admin_seen_at) ? ' • Seen' : ''}</p>
        </article>;
      })}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-white/70">{notice}</p>}
    <form onSubmit={event => void send(event)} className="mt-4">
      <label htmlFor={`message-${orderId}`} className="text-sm font-bold">Your message</label>
      <textarea id={`message-${orderId}`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} rows={3} readOnly={sending || Boolean(pending.current)} placeholder="Write a message about this order…" className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-base text-white outline-none focus:border-red-500" />
      <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-white/50">{draft.length}/4,000</span>
        <button type="submit" disabled={sending || !draft.trim() || !loaded} className="rounded-full bg-red-600 px-7 py-3 font-black hover:bg-red-500 disabled:opacity-50">{sending ? 'Sending…' : pending.current ? 'Retry Message' : 'Send Message'}</button>
      </div>
    </form>
    {admin && notifications.length > 0 && <div className="mt-4 rounded-xl border border-amber-700/50 p-3 text-sm text-amber-100">
      <p>{notifications.length} email notification{notifications.length === 1 ? '' : 's'} awaiting delivery.</p>
      {notifications.some(job => job.state === 'needs_review') && <p className="mt-1">A delivery needs provider reconciliation before retrying.</p>}
      <button type="button" onClick={() => { void orderChat({ action: 'retry', orderId }).then(() => load()).catch(error => setError(error.message)); }} className="mt-2 font-bold underline">Retry eligible notifications</button>
    </div>}
  </section>;
}
