import { supabase } from '@/lib/supabase';

export type OrderMessage = {
  id: string; order_id: string; sender_type: 'admin' | 'customer'; sender_name: string;
  message: string; created_at: string; customer_seen_at: string | null; admin_seen_at: string | null;
};

export async function orderChat<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('order-chat', { body });
  if (error) {
    let detail = 'Could not connect to the order conversation. Please try again.';
    if ('context' in error && error.context instanceof Response) {
      try { detail = (await error.context.json()).error ?? detail; } catch { /* use safe fallback */ }
    }
    const failure = new Error(detail) as Error & { status?: number };
    failure.status = 'context' in error && error.context instanceof Response ? error.context.status : undefined;
    throw failure;
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
