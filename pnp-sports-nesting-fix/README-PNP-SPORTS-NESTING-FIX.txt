PNP SPORTS NESTING FIX
======================

This update fixes the issue where newly uploaded Sports Team Categories appear
on the main Wraps page instead of inside Sports.

It also:
- Moves San Francisco 49ers and Los Angeles Rams into Sports without re-uploading.
- Loads all future Sports Team Categories dynamically.
- Includes new teams in the Sports design total.
- Sends customers back to Sports from dynamic team galleries.
- Zooms the Rams category image slightly to scale-[1.18].

INSTALL
-------
1. Upload this ZIP to the root of the pressedinpink Codespace.
2. Run:

   unzip -o pnp-sports-nesting-fix.zip
   node pnp-sports-nesting-fix/apply-pnp-sports-nesting-fix.mjs

3. In Supabase > SQL Editor, run:

   supabase/pnp-sports-nesting-fix.sql

4. Back in Codespaces, deploy and test:

   npx supabase functions deploy upload-wrap
   rm -rf .next out
   npm run build

5. If the build succeeds:

   git add .
   git commit -m "Fix nested sports categories"
   git push

Backups are created automatically under:
.pnp-backups/sports-nesting-fix-DATE-TIME/
