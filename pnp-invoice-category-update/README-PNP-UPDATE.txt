PNP Invoice + Category Uploader Update
======================================

This patch makes the three requested Pressed In Pink changes:

1) INVOICE
- The invoice number shown in the top-right PDF box now matches the order number, e.g. #013.
- The internal saved invoice number is NOT changed, so existing invoice records and downloaded filenames keep working.
- The large NOTES box is removed.
- The bottom footer now says exactly:
  "Thank you for supporting Pressed In Pink."

2) CATEGORY IMAGE RESIZE
- Adds a 50%-200% size slider to the Category Card Image uploader.
- The preview updates live.
- The selected size is baked into a square transparent WebP before R2 upload.
- The upload function resets old category CSS image scaling to scale-100 so the uploaded image's baked size is what shows on the live category card.

3) CATEGORY DESCRIPTIONS
- Removes the Category description field from the wrap uploader.
- New categories save a blank description for database compatibility.
- Removes visible descriptions from the main Wrap category cards.
- Removes visible descriptions from Sports team category cards.
- Category search no longer searches hidden description text.
- Existing database description values are left untouched so no destructive database migration is needed.

HOW TO APPLY IN GITHUB CODESPACES
=================================

From the ROOT of your pressedinpink Codespace:

1. Upload this ZIP into the repository root.

2. Run:

   unzip -o pnp-invoice-category-update.zip
   python3 pnp-invoice-category-update/apply-pnp-update.py

3. Build the site:

   npm run build

4. Redeploy the updated Supabase upload function:

   npx supabase functions deploy upload-wrap

5. If both commands succeed, commit and push:

   git status
   git add .
   git commit -m "Update PNP invoice and category uploader"
   git push origin main

WHAT TO TEST
============

Invoice:
- Open an order such as #013.
- Build/download the invoice.
- Top-right box should show #013 instead of PNP-INV-2026-000004.
- NOTES box should be gone.
- Footer should read "Thank you for supporting Pressed In Pink."

Category image:
- Admin > Wrap Catalog Manager.
- Choose an existing category or create a new one.
- Pick a Category Card Image.
- Move the size slider from 50% to 200%.
- Confirm the preview changes.
- Upload/replace the category image.
- Open /wraps and confirm the live card matches the chosen fit.

Descriptions:
- New category form should have no Category description field.
- /wraps category cards should show only image, name, design count, and View Designs.
- /wraps/sports should do the same.

SAFETY
======

The script patches everything in memory first. If it cannot find an expected code anchor, it stops before writing the update.

Before changing files, it creates backups under:
.pnp-backups/YYYYMMDD-HHMMSS/

No SQL migration is required.
