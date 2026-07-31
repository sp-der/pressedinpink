PNP email + Villains orientation repair

This overlay includes:
- the safer send-order-link Edge Function repair
- a Villains thumbnail orientation correction
- per-category image-orientation support for legacy thumbnails

Extract this ZIP into the Pressed In Pink repository root, then run:

  npx supabase functions deploy send-order-link
  npm run build

If the build succeeds:

  git add .
  git commit -m "Fix order emails and Villains wrap orientation"
  git push origin HEAD

Then submit one new test order and refresh the Villains category after Cloudflare finishes deploying.
