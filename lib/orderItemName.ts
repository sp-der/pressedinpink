import { wrapCategories } from "@/data/wrapCategories";
import type { OrderItemRecord } from "@/types/orders";

const wrapLabels = new Map(
  Object.values(wrapCategories).map((category) => [category.slug, category.itemLabel]),
);

/** Derive labels for both existing orders and future uploads. */
export function getAdminOrderItemName(
  item: Pick<OrderItemRecord, "category_slug" | "category_name" | "display_name">,
): string {
  if (item.category_slug.startsWith("custom-cup-")) return "Custom Cup Order";

  if (item.category_slug === "sanitizer-wraps") return "Sanitizer Wrap";

  if (item.category_slug.startsWith("cup-")) {
    return item.display_name;
  }

  const categoryName = wrapLabels.get(item.category_slug) || item.category_name.trim();
  return categoryName ? `${categoryName} UV-DTF Wrap` : item.display_name;
}
