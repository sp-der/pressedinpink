import { supabase } from "@/lib/supabase";
import type {
  CatalogCategoryRecord,
  CatalogWrapRecord,
} from "@/types/catalog";

export type CatalogWrapCounts = Record<string, number>;

type CountableWrap = Pick<
  CatalogWrapRecord,
  "category_id" | "image_number"
>;

const WRAP_COUNT_PAGE_SIZE = 1000;

async function loadAllCountableWraps(): Promise<CountableWrap[]> {
  const allWraps: CountableWrap[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("catalog_wraps")
      .select("category_id, image_number")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .range(from, from + WRAP_COUNT_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as CountableWrap[];
    allWraps.push(...page);

    if (page.length < WRAP_COUNT_PAGE_SIZE) {
      break;
    }

    from += WRAP_COUNT_PAGE_SIZE;
  }

  return allWraps;
}

export async function loadCatalogWrapCounts(): Promise<CatalogWrapCounts> {
  const [categoryResult, wraps] = await Promise.all([
    supabase
      .from("catalog_categories")
      .select("*")
      .eq("is_active", true),
    loadAllCountableWraps(),
  ]);

  if (categoryResult.error) {
    throw categoryResult.error;
  }

  const categories =
    (categoryResult.data ?? []) as CatalogCategoryRecord[];
  const uploadedNumbersByCategory = new Map<string, Set<number>>();

  for (const wrap of wraps) {
    const current =
      uploadedNumbersByCategory.get(wrap.category_id) ?? new Set<number>();

    current.add(wrap.image_number);
    uploadedNumbersByCategory.set(wrap.category_id, current);
  }

  return Object.fromEntries(
    categories.map((category) => {
      const uploadedNumbers =
        uploadedNumbersByCategory.get(category.id) ?? new Set<number>();
      let total = Math.max(0, category.base_image_count);

      for (const imageNumber of uploadedNumbers) {
        if (imageNumber > category.base_image_count) {
          total += 1;
        }
      }

      return [category.slug, total];
    }),
  );
}
