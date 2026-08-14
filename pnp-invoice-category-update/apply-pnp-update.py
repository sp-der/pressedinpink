#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
import shutil
import sys

ROOT = Path.cwd()

TARGETS = [
    Path("lib/invoicePdf.ts"),
    Path("app/admin/catalog/page.tsx"),
    Path("app/wraps/page.tsx"),
    Path("app/wraps/sports/page.tsx"),
    Path("supabase/functions/upload-wrap/index.ts"),
]

def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    raise SystemExit(1)

def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 1:
        print(f"  ✓ {label}")
        return text.replace(old, new, 1)
    if count == 0 and new in text:
        print(f"  ✓ {label} already applied")
        return text
    fail(f"{label}: expected exactly 1 match, found {count}. No files were intentionally overwritten after this failure.")
    return text

def remove_between(text: str, start: str, end: str, label: str) -> str:
    if start not in text:
        print(f"  ✓ {label} already removed")
        return text
    start_index = text.find(start)
    end_index = text.find(end, start_index)
    if end_index == -1:
        fail(f"{label}: could not find the ending anchor.")
    print(f"  ✓ {label}")
    return text[:start_index] + text[end_index:]

def patch_invoice(text: str) -> str:
    text = replace_once(
        text,
        "truncate(invoice.invoiceNumber, 24)",
        "truncate(invoice.orderNumber || invoice.invoiceNumber, 24)",
        "Invoice header now uses the order number",
    )

    text = replace_once(
        text,
        '"Thank you for choosing Pressed In Pink"',
        '"Thank you for supporting Pressed In Pink."',
        "Invoice footer thank-you text",
    )

    notes_start = '    stream += fillRect(44, boxY, 278, 112, "0.965 0.965 0.965");'
    totals_start = '    stream += fillRect(342, boxY, 226, 112, "0.075 0.075 0.075");'
    text = remove_between(
        text,
        notes_start,
        totals_start,
        "Invoice NOTES box",
    )
    return text

CATEGORY_IMAGE_HELPER = r'''
async function convertCategoryImageToWebp(
  file: File,
  sizePercent: number,
  canvasSize = 1600,
  quality = 0.9,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const fitScale = Math.min(
    canvasSize / bitmap.width,
    canvasSize / bitmap.height,
  );
  const finalScale = fitScale * (sizePercent / 100);
  const drawWidth = Math.max(
    1,
    Math.round(bitmap.width * finalScale),
  );
  const drawHeight = Math.max(
    1,
    Math.round(bitmap.height * finalScale),
  );

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    bitmap.close();
    throw new Error(
      "This browser could not prepare the category image.",
    );
  }

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    Math.round((canvasSize - drawWidth) / 2),
    Math.round((canvasSize - drawHeight) / 2),
    drawWidth,
    drawHeight,
  );
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!webp) {
    throw new Error(
      "This browser could not convert the category image to WebP.",
    );
  }

  return webp;
}

'''

SLIDER_UI = r'''
                {categoryImageFile && (
                  <div className="mt-4 rounded-2xl border border-red-900 bg-black/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-black">
                        Category image size
                      </span>
                      <span className="rounded-full border border-red-700 px-3 py-1 text-xs font-black text-red-300">
                        {categoryImageScale}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={categoryImageScale}
                      disabled={uploading || savingCategoryImage}
                      onChange={(event) =>
                        setCategoryImageScale(
                          Number(event.target.value),
                        )
                      }
                      className="mt-4 w-full accent-red-600"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs font-bold text-white/50">
                      <span>Smaller</span>
                      <button
                        type="button"
                        onClick={() => setCategoryImageScale(100)}
                        disabled={uploading || savingCategoryImage}
                        className="rounded-full border border-red-800 px-3 py-1 text-white/75 transition hover:border-red-500 hover:text-white disabled:opacity-50"
                      >
                        Reset to 100%
                      </button>
                      <span>Larger</span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/55">
                      Use the preview to fit the artwork. This size is baked into the uploaded square WebP so the live category card matches it.
                    </p>
                  </div>
                )}
'''

def patch_admin_catalog(text: str) -> str:
    if "async function convertCategoryImageToWebp(" not in text:
        anchor = "function categoryLabel(\n"
        if anchor not in text:
            fail("Category image helper: could not find categoryLabel anchor.")
        text = text.replace(anchor, CATEGORY_IMAGE_HELPER + anchor, 1)
        print("  ✓ Added category image resize converter")
    else:
        print("  ✓ Category image resize converter already applied")

    state_pattern = re.compile(
        r'\n  const \[description, setDescription\]\s*=\s*\n\s*useState\(""\);'
    )
    if state_pattern.search(text):
        text = state_pattern.sub("", text, count=1)
        print("  ✓ Removed category description state")
    else:
        print("  ✓ Category description state already removed")

    description_form = '''    formData.append(
      "description",
      description.trim(),
    );
'''
    if description_form in text:
        text = text.replace(description_form, "", 1)
        print("  ✓ Removed category description from uploader payload")
    else:
        print("  ✓ Category description payload already removed")

    description_label = '              <label className="sm:col-span-2">\n                <span className="text-sm font-bold">Category description</span>'
    if description_label in text:
        start = text.find(description_label)
        end = text.find("              </label>\n", start)
        if end == -1:
            fail("Category description field: closing label not found.")
        end += len("              </label>\n")
        text = text[:start] + text[end:]
        print("  ✓ Removed category description field")
    else:
        print("  ✓ Category description field already removed")

    preview_state = '''  const [categoryImagePreview, setCategoryImagePreview] =
    useState("");
'''
    scale_state = '''  const [categoryImageScale, setCategoryImageScale] =
    useState(100);
'''
    if scale_state not in text:
        if preview_state not in text:
            fail("Category image scale state: preview state anchor not found.")
        text = text.replace(preview_state, preview_state + scale_state, 1)
        print("  ✓ Added category image size state")
    else:
        print("  ✓ Category image size state already applied")

    old_convert = '''    const categoryWebp = await convertToWebp(
      categoryImageFile,
      1600,
      0.9,
    );
'''
    new_convert = '''    const categoryWebp = await convertCategoryImageToWebp(
      categoryImageFile,
      categoryImageScale,
      1600,
      0.9,
    );
'''
    text = replace_once(
        text,
        old_convert,
        new_convert,
        "Category image upload uses selected size",
    )

    old_preview = '                    className="h-full w-full object-contain p-3"\n'
    new_preview = '''                    className="h-full w-full object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${categoryImageScale / 100})`,
                    }}
'''
    text = replace_once(
        text,
        old_preview,
        new_preview,
        "Category image preview reacts to size slider",
    )

    old_file_change = '''                  onChange={(event) =>
                    setCategoryImageFile(
                      event.target.files?.[0] ?? null,
                    )
                  }
'''
    new_file_change = '''                  onChange={(event) => {
                    setCategoryImageFile(
                      event.target.files?.[0] ?? null,
                    );
                    setCategoryImageScale(100);
                  }}
'''
    text = replace_once(
        text,
        old_file_change,
        new_file_change,
        "Category image selection resets size to 100%",
    )

    slider_anchor = '                  className="mt-4 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-5 file:py-3 file:font-black file:text-white hover:file:bg-red-500"\n                />\n'
    if SLIDER_UI.strip() not in text:
        if slider_anchor not in text:
            fail("Category image slider: file input anchor not found.")
        text = text.replace(
            slider_anchor,
            slider_anchor + SLIDER_UI,
            1,
        )
        print("  ✓ Added category image size slider")
    else:
        print("  ✓ Category image size slider already applied")

    return text

def patch_main_wraps(text: str) -> str:
    text = replace_once(
        text,
        "`${category.title} ${category.description} ${category.keywords}`",
        "`${category.title} ${category.keywords}`",
        "Main wrap search no longer uses descriptions",
    )

    card_description = '''                  <p
                    className="mt-4 text-sm leading-6"
                    style={smokyTextShadow}
                  >
                    {category.description}
                  </p>
'''
    if card_description in text:
        text = text.replace(card_description, "", 1)
        print("  ✓ Removed descriptions from main wrap category cards")
    elif "{category.description}" not in text:
        print("  ✓ Main wrap category descriptions already removed")
    else:
        fail("Main wrap category card description block changed unexpectedly.")
    return text

def patch_sports_wraps(text: str) -> str:
    search_line = "      ${category.description}\n"
    if search_line in text:
        text = text.replace(search_line, "", 1)
        print("  ✓ Sports search no longer uses descriptions")
    else:
        print("  ✓ Sports search description already removed")

    card_description = '''                  <p
                    className="mt-4 text-sm leading-6 text-white"
                    style={smokyTextShadow}
                  >
                    {category.description}
                  </p>
'''
    if card_description in text:
        text = text.replace(card_description, "", 1)
        print("  ✓ Removed descriptions from sports category cards")
    elif 'className="mt-4 text-sm leading-6 text-white"' not in text:
        print("  ✓ Visible sports category descriptions already removed")
    else:
        fail("Sports category card description block changed unexpectedly.")
    return text

def patch_upload_wrap(text: str) -> str:
    if '    const description = String(\n' in text:
        start = text.find('    const description = String(\n')
        end = text.find('    const keywords = String(\n', start)
        if end == -1:
            fail("Upload function description parser: keywords anchor not found.")
        text = text[:start] + text[end:]
        print("  ✓ Removed description parsing from upload function")
    else:
        print("  ✓ Upload function description parser already removed")

    old_insert = '''          description,
          keywords,
'''
    new_insert = '''          description: "",
          keywords,
'''
    text = replace_once(
        text,
        old_insert,
        new_insert,
        "New categories store an empty description",
    )

    old_image_update = '''      .update({
        card_image_url: categoryImageUrl,
      })
'''
    new_image_update = '''      .update({
        card_image_url: categoryImageUrl,
        image_scale: "scale-100",
      })
'''
    text = replace_once(
        text,
        old_image_update,
        new_image_update,
        "Uploaded category images reset legacy CSS scaling",
    )
    return text

PATCHERS = {
    Path("lib/invoicePdf.ts"): patch_invoice,
    Path("app/admin/catalog/page.tsx"): patch_admin_catalog,
    Path("app/wraps/page.tsx"): patch_main_wraps,
    Path("app/wraps/sports/page.tsx"): patch_sports_wraps,
    Path("supabase/functions/upload-wrap/index.ts"): patch_upload_wrap,
}

def main() -> None:
    print("Pressed In Pink update")
    print("======================")
    print(f"Repo: {ROOT}")

    missing = [str(path) for path in TARGETS if not (ROOT / path).exists()]
    if missing:
        fail(
            "Run this script from the root of the pressedinpink repository. "
            "Missing: " + ", ".join(missing)
        )

    originals: dict[Path, str] = {}
    patched: dict[Path, str] = {}

    # First pass: patch in memory only. If an anchor fails, nothing is written.
    for relative in TARGETS:
        path = ROOT / relative
        originals[relative] = path.read_text(encoding="utf-8")
        print(f"\n{relative}")
        patched[relative] = PATCHERS[relative](originals[relative])

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_root = ROOT / ".pnp-backups" / timestamp

    changed = [
        relative
        for relative in TARGETS
        if patched[relative] != originals[relative]
    ]

    if not changed:
        print("\nEverything in this update is already applied.")
        return

    for relative in changed:
        backup = backup_root / relative
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / relative, backup)

    for relative in changed:
        (ROOT / relative).write_text(
            patched[relative],
            encoding="utf-8",
        )

    print("\nUpdate applied successfully.")
    print(f"Backups: {backup_root}")
    print("\nChanged files:")
    for relative in changed:
        print(f"  - {relative}")

    print("\nNext:")
    print("  1. npm run build")
    print("  2. npx supabase functions deploy upload-wrap")
    print("  3. git add .")
    print('  4. git commit -m "Update PNP invoice and category uploader"')
    print("  5. git push origin main")

if __name__ == "__main__":
    main()
