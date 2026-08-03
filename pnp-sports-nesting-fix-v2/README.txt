PNP SPORTS NESTING FIX V2

This version is designed to run after the first installer partially updated:
- supabase/functions/upload-wrap/index.ts
- app/wraps/page.tsx

It does not require undoing the first attempt.

From the repository root:

1. Extract this ZIP.
2. Run:
   node pnp-sports-nesting-fix-v2/apply-pnp-sports-nesting-fix-v2.mjs

3. In Supabase SQL Editor, run:
   supabase/pnp-sports-nesting-fix.sql

4. Back in Codespaces, run:
   npx supabase functions deploy upload-wrap
   rm -rf .next out
   npm run build

5. After a successful build:
   git add .
   git commit -m "Fix nested sports categories"
   git push
