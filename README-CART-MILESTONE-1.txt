
PRESSED IN PINK CART - MILESTONE 1
==================================

WHAT THIS PACKAGE ADDS
----------------------
- Shared wrap gallery for every current category
- Product names such as Lakers 1, Pooh 42, and Hello Kitty 142
- Quantity selectors on every wrap
- Add to Cart buttons
- Full-viewer Add to Cart controls
- Floating cart button with total quantity
- /cart page
- Increase, decrease, type, remove, and clear quantities
- Cart saved in the browser after refreshes
- No prices, payments, accounts, or order submission yet

THIS PACKAGE DOES NOT REQUIRE NPM INSTALL
-----------------------------------------
It uses React and Next.js packages that are already in the project.

INSTALL STEP BY STEP
--------------------

1. Confirm you are in the project:

   cd /workspaces/pressedinpink

2. Confirm the cart branch:

   git branch --show-current

   It must say:

   cart-system

3. Confirm the current branch is clean before installing:

   git status

4. Upload pressedinpink-cart-milestone-1.zip into:

   /workspaces/pressedinpink

   The ZIP should be beside package.json and the app folder.

5. Extract it and replace matching files:

   unzip -o pressedinpink-cart-milestone-1.zip -d .

6. Delete the ZIP after extraction:

   rm -f pressedinpink-cart-milestone-1.zip

7. Confirm the important files exist:

   find components data types app/cart -maxdepth 2 -type f | sort

8. Confirm a category page is now small:

   cat app/wraps/sports/bulls/page.tsx

9. Clean old builds:

   pkill -f "next dev" || true
   pkill -f "next-server" || true
   rm -rf .next out

10. Run the production build:

   npm run build

11. Start the local site:

   npm run dev

TEST CHECKLIST
--------------

Open these pages:

- /wraps/sports/bulls
- /wraps/pooh
- /wraps/hello-kitty
- /cart

Test the following:

A. BULLS
- All five designs load.
- Each card says Bulls 1, Bulls 2, etc.
- Select quantity 2 and add Bulls 1.
- Cart button changes to 2.
- Add Bulls 1 again.
- The same item increases instead of making a duplicate.

B. POOH
- Add a wrap from page 1.
- Move to another gallery page.
- Add another Pooh design.
- Both designs stay in the cart.

C. HELLO KITTY
- Move across multiple gallery pages.
- Open the full-screen viewer.
- Use the viewer arrows.
- Add a design from inside the viewer.

D. CART
- Increase and decrease quantities.
- Type a quantity directly.
- Remove one design.
- Refresh the browser.
- Confirm the cart remains saved.
- Clear the cart and confirm it empties.

SAVE THE WORK TO THE CART BRANCH
--------------------------------

After everything works:

1. Stop the development server:

   pkill -f "next dev" || true

2. Review the changes:

   git status

3. Save them:

   git add -A
   git commit -m "Add browser wrap cart milestone one"
   git push

DO NOT MERGE INTO MAIN YET
--------------------------
Keep testing on cart-system. Milestone 2 will add Supabase, guest
submission, customer accounts, saved orders, and admin review.
