
PRESSED IN PINK
ORDER PORTAL + CONTACT + ADMIN VIEWER UPDATE
=============================================

THIS UPDATE FIXES
-----------------
1. Admin wrap previews now show the entire wrap horizontally.
2. Every new order gets a private order-status page.
3. The private link is emailed through Resend.
4. Guest and account checkout require a preferred contact:
   Email, Phone, Instagram, or TikTok.
5. The preferred contact is visible and clickable in admin.
6. Account and active guest sessions also receive a View Order Page button.

IMPORTANT
---------
The guest email was not previously broken.
The earlier website package did not yet include a function that sent
guest-order emails. This update adds that missing Edge Function.

Old test orders created before this migration do not have private portal
tokens. Submit a brand-new test order after completing every setup step.

PART A - INSTALL THE WEBSITE FILES
==================================

1. In Codespaces:

   cd /workspaces/pressedinpink

2. Confirm the branch:

   git branch --show-current

   It must say:

   cart-system

3. Upload:

   pressedinpink-order-portal-update.zip

   into /workspaces/pressedinpink.

4. Extract it:

   unzip -o pressedinpink-order-portal-update.zip -d .

5. Delete the ZIP:

   rm -f pressedinpink-order-portal-update.zip

6. Confirm the new page exists:

   ls -lah app/order-status/page.tsx

7. Confirm the Edge Function file exists:

   ls -lah supabase/functions/send-order-link/index.ts

PART B - RUN THE DATABASE MIGRATION
===================================

1. Open Supabase.

2. Open:

   SQL Editor
   > New query

3. In Codespaces, open:

   supabase/order-portal-contact-migration.sql

4. Copy the entire file.

5. Paste it into Supabase SQL Editor.

6. Click Run.

7. Open Table Editor > orders.

8. Confirm these columns now exist:

   contact_method
   contact_value
   portal_token_hash

This migration keeps existing users and orders. New orders receive secure
portal tokens. Existing old test orders do not receive usable raw tokens.

PART C - DEPLOY THE EMAIL EDGE FUNCTION
=======================================

Use the Supabase dashboard for the simplest setup.

1. In Supabase, open:

   Edge Functions

2. Click the button to create or deploy a new function.

3. Choose the editor/dashboard method.

4. Name the function exactly:

   send-order-link

5. In Codespaces, open:

   supabase/functions/send-order-link/index.ts

6. Copy the entire file.

7. Replace the editor contents with that code.

8. Keep JWT verification ENABLED.

9. Deploy the function.

The checkout invokes this function while the guest or customer has a valid
Supabase session. Anonymous checkout sessions also have authenticated JWTs.

PART D - ADD EDGE FUNCTION SECRETS
==================================

1. In Supabase, open the Edge Functions secrets page.

2. Add:

   RESEND_API_KEY

3. Paste the same Resend API key beginning with re_ that you used for the
   Resend/Supabase email setup.

4. Add:

   SITE_URL

5. Set it to:

   https://pressedinpink.com

6. Save the secrets.

Do not put RESEND_API_KEY into:
- NEXT_PUBLIC variables
- GitHub
- Cloudflare public environment variables
- committed .env files

Supabase automatically provides hosted Edge Functions with its own Supabase
URL, anon key, and service-role environment values. Only the Resend key and
site fallback URL need to be added manually.

PART E - BUILD THE WEBSITE
==========================

1. Stop old servers:

   pkill -f "next dev" || true
   pkill -f "next-server" || true

2. Clean builds:

   rm -rf .next out

3. Build:

   npm run build

4. Confirm the route list includes:

   /order-status

5. Start locally:

   npm run dev

PART F - TEST THE FULL HORIZONTAL ADMIN VIEWER
==============================================

1. Sign into admin.

2. Open:

   /admin/orders

3. Open an order.

4. Each wrap should now appear:
   - across the full width of its card
   - rotated sideways
   - fully visible
   - not cropped to a narrow left-side box

5. Open Image still opens the original file in a separate tab.

PART G - TEST PREFERRED CONTACT
===============================

1. Submit a BRAND-NEW order.

2. Checkout still requires an email because the private portal link is
   delivered there.

3. Choose one preferred contact:
   - Email
   - Phone
   - Instagram
   - TikTok

4. Enter the matching address, number, or username.

5. Submit.

6. Open the order in admin.

7. Confirm the right panel displays:

   Preferred Contact
   Instagram: @username

   or the selected alternative.

8. Email and phone contacts should be clickable.
   Instagram and TikTok should open the matching profile.

PART H - TEST THE PRIVATE ORDER EMAIL
=====================================

1. Submit a BRAND-NEW guest order.

2. The confirmation screen should say either:

   Your private order link was emailed successfully.

   or:

   Your order was saved, but the email could not be sent.

3. Check the customer's inbox and spam folder.

4. The message should come from:

   Pressed In Pink <support@pressedinpink.com>

5. Click:

   View My Order

6. The private portal should open at:

   /order-status/?order=...&token=...

7. Test the link in another browser or Incognito window.

8. The portal should show:
   - order number
   - latest status
   - requested total
   - approved total
   - full horizontal wrap images
   - quantity changes
   - unavailable designs
   - item messages
   - the main revision message

PART I - EMAIL TROUBLESHOOTING
==============================

If the confirmation says email failed:

1. Open Supabase:

   Edge Functions
   > send-order-link
   > Logs

2. Look at the newest red error.

3. Open Resend:

   Emails

4. Look for the attempted message and delivery response.

Common causes:
- RESEND_API_KEY was not added to Edge Function secrets
- the function name is not exactly send-order-link
- the function was not deployed
- JWT verification was disabled or misconfigured
- pressedinpink.com is not verified for sending in Resend
- support@pressedinpink.com is not allowed as a sender

The SMTP configuration used by Supabase Auth does not automatically make
custom application emails happen. The send-order-link Edge Function calls
the Resend Email API for each newly submitted order.

PART J - TEST ADMIN UPDATES
===========================

1. Change a quantity in admin.

2. Mark an item unavailable.

3. Add an item note.

4. Add a revision message.

5. Save.

6. Return to the private buyer portal.

7. Click Refresh Order.

8. Confirm the changes are visible.

PART K - SAVE TO GITHUB
=======================

After all tests pass:

   pkill -f "next dev" || true

   git status

   git add -A

   git commit -m "Add private order portals and preferred contact"

   git push

Keep this on cart-system until the complete flow passes.
