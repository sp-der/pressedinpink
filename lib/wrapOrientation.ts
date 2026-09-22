const DISPLAY_READY_UPLOADED_WRAP_CATEGORIES = [
  "toy story",
  "betty boop",
  "felix the cat",
] as const;

function normalizeCategoryIdentity(
  values: Array<string | null | undefined>,
): string {
  return values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * These categories already have landscape/display-ready WebPs in R2.
 * They are compatibility exceptions for uploads created before the
 * uploader started normalizing regular UV-DTF wraps to the gallery's
 * legacy portrait storage format.
 */
export function categoryUsesDisplayReadyUploads(
  values: Array<string | null | undefined>,
): boolean {
  const identity = normalizeCategoryIdentity(values);

  return DISPLAY_READY_UPLOADED_WRAP_CATEGORIES.some(
    (categoryName) => identity.includes(categoryName),
  );
}
