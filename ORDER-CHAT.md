# Order conversations

Each order has one thread in `order_messages`. Guests use the existing private portal; signed-in customers open **View Order & Chat** from their account. Admins use the conversation beside Order Review. Messages poll every five seconds while the page is visible; the orders list polls unread counts every ten seconds.

## Access controls

`order-chat` validates live user JWTs with Auth, then checks the database profile role or account-order ownership. Guest tokens are validated by the existing token RPC. Anonymous checkout sessions do not get an ownership shortcut. Sender identity, names, and email recipients come from the server. The messages, notification queue, and token store have RLS enabled and no public grants; all new privileged RPCs are service-role-only. The function disables the platform JWT gate to support guest tokens and the scheduled worker, and performs authorization inside its handler.

The original guest token hash stays untouched. Checkout email functions capture the validated token in encrypted private storage. For older orders whose original token cannot be recovered from its hash, notification emails get a supplementary token for that same order. The portal RPC accepts either token; existing links stay valid. The encryption key and worker credential are held in Vault.

## Revisions and email reliability

Changing nonempty `revision_message` text inserts an admin message and queues a customer email in the same transaction. Saving unchanged text, clearing it, or editing private notes does not create a message. Historical revisions are backfilled without notifications; the original field remains intact.

Sending chat inserts the message and outbox entry atomically. Per-order request IDs deduplicate retries; a reused ID with changed content or sender is rejected. A per-order limit permits twenty messages per sender type per minute. The outbox worker leases jobs, freezes the email payload before delivery, and uses `pnp-chat-<message-id>` as the Resend idempotency key. A Vault-authenticated cron job recovers pending jobs every minute, even with all pages closed. Messages remain saved during email outages. After 23 hours, ambiguous deliveries stop in `needs_review` to avoid sending again after Resend's 24-hour idempotency window. Reconcile those records with Resend before any manual resend.

Admin messages notify `orders.customer_email`. Customer messages notify `PNP_NOTIFICATION_EMAIL`, falling back to the existing `SUPPORT_EMAIL`. Sender configuration reuses `FROM_EMAIL`. Chat and order-confirmation links use `https://pressedinpink.com`; the invoice caller also passes that canonical origin. The deployed `send-invoice` bundle could not be retrieved and was not replaced.

## Checks

- `npx tsc --noEmit`
- `npm run build` with the usual public Supabase environment variables
- `npx deno check supabase/functions/order-chat/index.ts`
- `npx deno test supabase/functions/order-chat/logic.test.ts`
- Run `supabase/tests/order_chat.sql` in a privileged SQL session; its fixtures and messages roll back without creating auth accounts or sending mail.

Live guest checks cover swapped/missing tokens and order IDs, raw table/RPC access, sender spoofing, concurrent duplicate sends, conflicting retry bodies, seen timestamps, and original email links. Resend accepted one customer notification and one configured PNP notification. Full authenticated admin/account browser verification requires an existing authorized session; creation of privileged production test accounts was rejected by automatic approval review.
