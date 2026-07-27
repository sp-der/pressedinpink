
PRESSED IN PINK CART - MILESTONE 2
==================================

THIS PACKAGE ADDS
-----------------
- Guest checkout using name and email only
- Account creation using name and email only
- Account checkout without phone numbers
- Customer signup and login
- Account checkout
- Real Supabase order submission
- Guest order status in the same browser
- Registered customer order history
- Customer revision approval
- Protected admin login
- Admin orders dashboard
- Search and status filtering
- Admin quantity approval
- Item availability controls
- Customer-facing revision messages
- Private admin notes
- Order workflow statuses

IMPORTANT
---------
Stay on the cart-system branch.
Do not merge into main yet.

A. INSTALL THE ZIP
==================

1. Open the Codespaces terminal.

2. Enter the project:

   cd /workspaces/pressedinpink

3. Confirm the branch:

   git branch --show-current

   It must say:

   cart-system

4. Upload this ZIP into the project root:

   pressedinpink-cart-milestone-2.zip

5. Extract it:

   unzip -o pressedinpink-cart-milestone-2.zip -d .

6. Delete the ZIP:

   rm -f pressedinpink-cart-milestone-2.zip

7. Confirm the new pages:

   find app/checkout app/login app/signup app/account app/order-confirmation app/admin -type f | sort

8. Confirm the Supabase files:

   find supabase -maxdepth 1 -type f | sort

B. CREATE THE DATABASE
======================

1. Open your Supabase project.

2. Open SQL Editor.

3. Click New query.

4. In Codespaces, open:

   supabase/pressedinpink-orders.sql

5. Copy the entire file.

6. Paste it into Supabase SQL Editor.

7. Click Run.

8. Open Table Editor and confirm:

   profiles
   orders
   order_items
   order_events

C. BUILD LOCALLY
================

1. Stop old servers:

   pkill -f "next dev" || true
   pkill -f "next-server" || true

2. Remove old build folders:

   rm -rf .next out

3. Verify environment values without showing them:

   grep -q '^NEXT_PUBLIC_SUPABASE_URL=' .env.local \
     && echo "Supabase URL: YES" \
     || echo "Supabase URL: NO"

   grep -q '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' .env.local \
     && echo "Supabase key: YES" \
     || echo "Supabase key: NO"

4. Build:

   npm run build

5. Start locally:

   npm run dev

D. TEST GUEST CHECKOUT
======================

1. Add at least two wrap designs.

2. Open /cart.

3. Click Continue to Order Request.

4. Choose Guest Checkout.

5. Enter name, email, and optional notes. No checkout flow asks for a phone number.

6. Submit.

7. Confirm an order number appears, such as:

   PNP-2026-000001

8. Open /account.

9. Confirm the guest order appears.

10. In Supabase Table Editor, confirm rows appear in:

    orders
    order_items

E. TEST CUSTOMER ACCOUNT
========================

1. Open /signup.

2. Create a test account using name, email, and password. No phone number is requested.

3. Confirm the email if Supabase requires it.

4. Open /login and sign in.

5. Add wraps and use Account Checkout.

6. Open /account.

7. Confirm the order is saved.

F. CREATE AN ADMIN ACCOUNT
==========================

Using a separate admin email is recommended.

1. Sign out of the customer account first, or open the site in a private/incognito window.

2. Create the admin account through /signup.

3. Confirm its email if required.

3. In Supabase open:

   Authentication > Users

4. Find the admin account and copy its User UID.

5. Open:

   supabase/make-admin.sql

6. Replace both copies of:

   PASTE_USER_UID_HERE

7. Copy the completed SQL into Supabase SQL Editor.

8. Click Run.

9. Confirm the result says:

   role = admin

10. Sign out of customer or guest accounts.

11. Open:

    /admin/login

12. Sign in with the admin account.

13. The dashboard should open at:

    /admin/orders

G. TEST ADMIN REVIEW
====================

1. Open a submitted order.

2. Change status to Under Review and save.

3. Change one approved quantity.

4. Mark one item unavailable.

5. Add an item note.

6. Add a revision message.

7. Change status to Awaiting Your Approval.

8. Save.

9. Return to the matching customer or guest session.

10. Open /account.

11. Confirm the customer sees:
    revised quantities
    unavailable items
    revision message
    Approve Revision
    Request Changes

12. Approve the revision.

13. Return to admin and confirm the order status is Approved.

H. SAVE TO GITHUB
=================

After testing works:

1. Stop the server:

   pkill -f "next dev" || true

2. Review:

   git status

3. Save:

   git add -A

   git commit -m "Add Supabase checkout and admin orders"

   git push

Do not commit .env.local.

I. ADD CLOUDFLARE VARIABLES
===========================

Before Cloudflare can build this version:

1. Open Cloudflare.

2. Go to Workers & Pages.

3. Select the Pressed In Pink Pages project.

4. Open:

   Settings > Environment variables

5. Add:

   NEXT_PUBLIC_SUPABASE_URL

   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

6. Use the same values from .env.local.

7. Add them to Preview and Production.

8. Redeploy after saving.

J. SUPABASE URL SETTINGS
========================

In Supabase Authentication URL settings:

1. Set Site URL:

   https://pressedinpink.com

2. Add redirect URL:

   https://pressedinpink.com/**

SECURITY
========
- Never place the secret key or service-role key in NEXT_PUBLIC variables.
- The browser uses only the publishable key.
- Row Level Security separates customer and admin access.
- Customers can only read their own orders.
- Admin accounts can read and update all orders.
- Guest order access can be lost if the guest signs out or clears browser storage.
