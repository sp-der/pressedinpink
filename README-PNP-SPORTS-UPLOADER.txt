PRESSED IN PINK — SPORTS SUBCATEGORY UPLOADER UPDATE
====================================================

WHAT THIS ADDS
--------------
• A “Where should this category appear?” selector in the admin wrap uploader.
• “Main Wrap Categories” for normal categories.
• “Sports Team Categories” for teams that belong inside Sports.
• Newly created sports teams automatically appear on /wraps/sports.
• Sports teams stay hidden from the main /wraps category grid.
• New team wrap counts are included in the main Sports total.
• New teams use the existing live category gallery, so no new page.tsx is needed.
• The live team gallery returns customers to Sports instead of the main Wraps page.

INSTALL
-------
1. Extract this ZIP.
2. Put apply-pnp-sports-uploader-update.mjs in the ROOT of your pressedinpink repository.
3. Put pnp-sports-subcategories.sql inside the repository’s supabase folder.
4. In the Codespaces terminal, from the repository root, run:

   node apply-pnp-sports-uploader-update.mjs

5. Open Supabase Dashboard > SQL Editor.
6. Paste and run the contents of:

   supabase/pnp-sports-subcategories.sql

7. Back in Codespaces, deploy the updated uploader function:

   npx supabase functions deploy upload-wrap

8. Test the website build:

   rm -rf .next out
   npm run build

9. Commit and push:

   git add .
   git commit -m "Add sports subcategory support to wrap uploader"
   git push

HOW TO ADD A NEW TEAM AFTERWARD
--------------------------------
1. Open Admin > Wrap Catalog Manager.
2. Click Create New Category.
3. Under “Where should this category appear?” choose Sports Team Categories.
4. Enter the team name, slug, wrap label, description, and keywords.
5. Add the team/category card image.
6. Select the wrap images and publish.

The new team will appear inside Sports automatically. Its customer gallery URL will use:

/wraps/category/?slug=YOUR-TEAM-SLUG

BACKUPS
-------
The installer saves the original versions of every changed file under:

.pnp-backups/sports-uploader-DATE-TIME/

IMPORTANT
---------
Run the SQL migration before trying to create a Sports Team Category. The new uploader function expects the parent_slug database column to exist.
