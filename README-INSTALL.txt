PRESSED IN PINK - R2 GALLERY PAGE REPLACEMENTS

These files switch every current wrap gallery from local public/wraps files to:
https://images.pressedinpink.com/wraps

Included categories:
- 420
- 90s Cartoons
- Anime
- Hello Kitty and Friends
- K-Pop
- Labubu
- Music
- Nightmare Before Christmas
- Winnie the Pooh & Friends
- Villains
- Los Angeles Dodgers
- Los Angeles Lakers
- Los Angeles Clippers
- Boston Celtics
- Golden State Warriors
- Denver Nuggets
- Chicago Bulls

INSTALLATION
1. Wait for the R2 uploader to finish.
2. Extract this ZIP into the root of /workspaces/pressedinpink.
3. Allow it to replace the included page.tsx files.
4. Run:
   rm -rf .next out
   npm run build
5. Run:
   npm run dev
6. Test several small and large categories, especially:
   /wraps/sports/bulls
   /wraps/420
   /wraps/hello-kitty
   /wraps/villians

IMPORTANT
- Do not delete public/wraps yet.
- First verify every category loads from R2.
- The Villains route remains spelled /wraps/villians because that is the
  current app folder, while its R2 storage folder is /wraps/villains.
- Original images remain PNG files and thumbnails remain WebP files.
