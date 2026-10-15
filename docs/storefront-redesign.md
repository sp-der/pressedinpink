# Storefront redesign

## Baseline audit

Source baseline: `63c675e005cce028f728b2528e75567586965f77`.
Next.js 13.5.1 App Router static export, React 18, Tailwind 3.3.3. The live site uses black, lipstick red, the existing script wordmark, and lips imagery. The new palette retains those and adds muted pink accents. No logo replacement, generated merchandise, font download, or animation library.

Main architecture and protected journeys:

| Journey | Source / behavior retained |
| --- | --- |
| Home → premade / creators | `app/page.tsx`, `/premade`, `/for-creators`; all destinations retained |
| Collection hubs | `CollectionHub`, `StorefrontFrame`; cup, blank and creator URLs unchanged |
| UV-DTF browsing | `/wraps`, `/wraps/sports`, `/wraps/category?slug=…`; static and live category merges, sort, search, assignments retained |
| Wrap preview | `WrapGallery`; 50 per page, full viewer, adjacent-image preloading, legacy and display-ready rotation flags retained |
| Cup detail | `CupGallery`, `CupDetail`, `BlankCupGallery`, `BlankCupDetail`; existing product IDs and one-of-one rules retained |
| Custom cup | `/custom-cup`; existing draft persistence, eligibility, wrap picker, lid selections, submission data retained |
| Cart | `CartProvider`; existing storage key, normalization, synchronization, quantity limits retained; new event is presentation-only |
| Checkout | `/checkout`; guest/contact validation, account branch, order RPC and email call unchanged |
| Accounts | AuthProvider, login, signup, account; remember-me and authorization unchanged |
| Order portal and admin | order-status, OrderConversation, admin/order, admin/catalog, functions; no changes |

Image delivery: originals and pre-generated wrap thumbnails on R2; cup videos on R2; 61 blank WebP images materialized at build time from the tracked archive; shirt WebP images in public. Next image optimization is intentionally disabled for the static export. Baseline production build passed with 184 generated pages.

Potential bottlenecks: live wrap records are fetched per collection before client pagination; cup videos formerly requested metadata for the entire gallery; large legacy backdrop and logo files; category art PNGs. This change defers cup video source attachment to viewport proximity, adds two compact WebP frame captures, and preserves wrap pagination/lazy loading. No data query rewrite.

## Components and visual system

`StorefrontHeader`: shared desktop navigation and native disclosure mobile menu.
`CollectionHeader`: reusable collection banner with optional artwork.
`ProductRail`: native horizontal scroll, keyboard focus and previous/next buttons; no autoplay.
`CustomerCreations`: optional, approved-content-only gallery.
`useDialogFocus`: keyboard focus containment and restoration for wrap previews.

Design tokens are `--pnp-*` in globals.css. New storefront styling is scoped to PNP classes; legacy catalog theme changes apply only under `.pnp-legacy`. Admin, checkout, account and order logic are not restyled. Existing shared controls receive improved focus/touch styling.

The homepage uses actual catalog imagery. `public/storefront/{libby,snowglobe}.webp` are still frames at 1 second from the existing first Libby and Snowglobe R2 videos, not new products. These illustrate collections; availability is confirmed with the existing order-request process. No bestseller or new-arrival claims.

## Publish customer creations

Edit `data/customerCreations.ts` and add an entry only after the owner approves the specific image and permission for public display is documented. Add `image`, descriptive `alt`, an anonymous `caption`, and a non-sensitive `permissionReference` (for example an internal approval ticket ID, never private customer correspondence). Add optimized WebP photography under `public/customer-creations/`, with no names, personal photos or testimonials. Preview and review the page before merging. Empty/unapproved content produces no public section. This is a source-managed content path and does not add a database table or admin uploader.

## Existing issues kept separate

- Cart non-one-of-one images use an unconditional rotation; catalog and admin use different flags/dimensions. This predates the redesign. The original transforms and source URLs are retained; a dedicated orientation fix should reconcile stored cart metadata across all product types.
- Category image error handlers may repeatedly retry a failing fallback; unchanged.
- No existing frontend test suite or lint configuration was present. The existing tests are Supabase order-chat logic/SQL tests; they require their corresponding runtime/database.
- Next.js dependency and Browserslist currency are outside this visual-change scope.
- Guest checkout and authenticated order submission cannot be safely proven against production without placing an order; do not submit production test requests or send customer email.

## Verification / release

Use a feature branch and a remotely accessible preview. Do not merge to production until the preview is inspected on mobile/desktop and affected shopping flows are checked. Build-only dummy Supabase settings must never be deployed as production credentials. No secrets, database records, RLS, email or payment settings should be changed for this release.
