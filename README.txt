PRESSED IN PINK EMAIL THEME UPDATE
==================================

This package updates both emails to match the black/red PNP website.

ORDER PORTAL EMAIL
------------------
Replace:
supabase/functions/send-order-link/index.ts

Then run:
deno check supabase/functions/send-order-link/index.ts

Copy the full file into:
Supabase > Edge Functions > send-order-link

Click Deploy updates.

The existing RESEND_API_KEY and SITE_URL secrets stay unchanged.

ACCOUNT SIGNUP EMAIL
--------------------
Open:
supabase-auth-confirm-signup-template.html

Copy the entire template into:
Supabase > Authentication > Email Templates > Confirm signup

Suggested subject:
Confirm your Pressed In Pink account 💕

Do not alter:
{{ .ConfirmationURL }}

TESTING
-------
Signup:
Create an account with a new email address.

Order portal:
Submit a brand-new order and verify the email in Resend > Emails.

Some inboxes reduce shadows or rounded corners, but the core black,
red, and white theme will remain.
