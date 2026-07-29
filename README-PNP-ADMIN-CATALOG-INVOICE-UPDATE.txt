PRESSED IN PINK: ADMIN CATALOG + INVOICE UPDATE
================================================

This package already contains the existing cart-system code. You do not need
to find or switch to a different branch before applying it.

WHAT THIS UPDATE ADDS
---------------------
1. Persistent customer/admin login with a visible "Keep me signed in" option.
2. Buyer information and order controls moved above the wrap list.
3. PNP new-order notification email in addition to the customer's portal email.
4. New versioned favicon and 1200x630 Instagram/Open Graph preview image.
5. Princesses category and live Princesses gallery.
6. Admin wrap uploader that converts PNG/JPG/WebP to WebP in the browser,
   uploads the full image and thumbnail directly to R2, and publishes it.
7. Invoice builder with approved quantities, per-wrap pricing, shipping,
   discount, tax, automatic totals, PDF download, and customer email.
8. New categories created in the admin uploader appear through the live generic
   category page without a GitHub rebuild.

IMPORTANT
---------
Extracting the ZIP places all website, SQL, and Edge Function files in the
correct repository folders. GitHub/Cloudflare can deploy the website code
normally, but Supabase database changes, Edge Functions, and secret values
require one one-time setup because GitHub cannot safely invent or store those
external credentials.

STEP 1: EXTRACT INTO THE REPOSITORY ROOT
----------------------------------------
Extract the update so that folders such as app, components, lib, public,
supabase, and types merge with the existing folders.

Do not delete your existing .env.local file. The update ZIP intentionally does
not contain it.

STEP 2: RUN THE DATABASE UPDATE ONCE
------------------------------------
Open:
  Supabase Dashboard > SQL Editor > New query

Paste and run the entire file:
  supabase/pnp-admin-catalog-invoices.sql

This creates the live catalog tables, Princesses catalog entry, invoice tables,
security policies, and existing-category counters.

STEP 3: DEPLOY THE THREE SUPABASE EDGE FUNCTIONS
-------------------------------------------------
From the repository root in Codespaces:

  npx supabase login
  npx supabase link --project-ref YOUR_PROJECT_REF
  npx supabase functions deploy send-order-link
  npx supabase functions deploy upload-wrap
  npx supabase functions deploy send-invoice

YOUR_PROJECT_REF is the first part of NEXT_PUBLIC_SUPABASE_URL. For example,
https://abcdef.supabase.co uses project ref abcdef.

STEP 4: ADD/CONFIRM SUPABASE FUNCTION SECRETS
----------------------------------------------
Set these in Supabase Dashboard > Edge Functions > Secrets, or use the
Supabase CLI.

Already used by the order email system:
  RESEND_API_KEY
  SITE_URL=https://pressedinpink.com
  FROM_EMAIL=Pressed In Pink <support@pressedinpink.com>
  SUPPORT_EMAIL=support@pressedinpink.com

New-order notification destination:
  PNP_NOTIFICATION_EMAIL=support@pressedinpink.com

If support@pressedinpink.com forwards to PNP's personal inbox, leave it as
shown. Otherwise set PNP_NOTIFICATION_EMAIL to the exact email that should
receive new-order alerts.

R2 uploader secrets:
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
  R2_PUBLIC_BASE_URL=https://images.pressedinpink.com

Use an R2 API token that can write objects only to the PNP wrap bucket. Never
put these R2 secrets in NEXT_PUBLIC variables or frontend files.

CLI example, replacing every placeholder:

  npx supabase secrets set \
    RESEND_API_KEY="YOUR_RESEND_KEY" \
    SITE_URL="https://pressedinpink.com" \
    FROM_EMAIL="Pressed In Pink <support@pressedinpink.com>" \
    SUPPORT_EMAIL="support@pressedinpink.com" \
    PNP_NOTIFICATION_EMAIL="support@pressedinpink.com" \
    R2_ACCOUNT_ID="YOUR_R2_ACCOUNT_ID" \
    R2_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID" \
    R2_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY" \
    R2_BUCKET_NAME="YOUR_BUCKET_NAME" \
    R2_PUBLIC_BASE_URL="https://images.pressedinpink.com"

After changing secrets, redeploy upload-wrap, send-order-link, and send-invoice.

STEP 5: BUILD AND PUSH THE CURRENT BRANCH
-----------------------------------------
You do not need to know the old cart branch name. These commands push whichever
branch is currently open:

  git branch --show-current
  npm run build
  git status
  git add .
  git commit -m "Add PNP catalog uploader invoices and order alerts"
  git push origin HEAD

Cloudflare Pages should rebuild from GitHub as usual.

USING THE NEW ADMIN FEATURES
----------------------------
Orders dashboard:
  /admin/orders/

Catalog uploader:
  /admin/catalog/

Princesses page:
  /wraps/princesses/

To add Princesses images:
  1. Open Admin > Wrap Catalog Manager.
  2. Select Princesses.
  3. Select one or many original PNG/JPG/WebP files.
  4. Click Convert to WebP & Publish.

The browser creates:
  - a high-quality full WebP, maximum dimension 5000 px
  - a smaller WebP thumbnail, maximum dimension 700 px

The Edge Function assigns the next wrap number, uploads both to R2, saves the
catalog record, and makes the wrap visible. The original local file is not
uploaded to GitHub.

To add a completely new category:
  1. Click Create New Category in the uploader.
  2. Enter the name, slug/folder, label, filename prefix, description, and
     search keywords.
  3. Upload at least one image.

The first uploaded thumbnail becomes the card image for a new category.
Existing category artwork is not replaced by later uploads.

INVOICE FLOW
------------
1. Open an order.
2. Review and save available quantities.
3. Enter a unit price beside each approved wrap.
4. Add shipping, discount, tax amount, and optional notes.
5. Save Draft, Download PDF, or Email Invoice to Customer.

Emailing the invoice attaches the generated PDF, changes the order status to
Invoice Sent, and records an order event.

INSTAGRAM PREVIEW NOTE
----------------------
The new social preview uses a new file path:
  /pnp-social-preview-v2.png

This prevents the website from requesting the previously cached image URL.
Instagram can still take time to recrawl a link after deployment.

QUICK TEST CHECKLIST
--------------------
[ ] Customer login remains active after closing and reopening the browser.
[ ] Admin login remains active after closing and reopening the browser.
[ ] New order sends the customer portal email.
[ ] New order sends PNP's notification email.
[ ] Buyer information appears before wrap cards on the admin order page.
[ ] Princesses appears on the wraps category page.
[ ] Admin can upload one Princesses image and see it on the public page.
[ ] Admin can download a PDF invoice.
[ ] Admin can email the PDF invoice to the customer.
[ ] Shared Instagram link uses the new Pressed In Pink preview.
