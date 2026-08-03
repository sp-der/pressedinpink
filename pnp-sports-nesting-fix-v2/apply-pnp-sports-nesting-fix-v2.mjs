import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  root,
  ".pnp-backups",
  `sports-nesting-fix-v2-${timestamp}`,
);

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

function write(relativePath, contents) {
  const fullPath = path.join(root, relativePath);
  const backupPath = path.join(backupRoot, relativePath);

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, backupPath);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, "utf8");
  console.log(`Updated ${relativePath}`);
}

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(
      `Could not find ${label}. Please send the current file so it can be merged safely.`,
    );
  }
}

function patchUploadFunction() {
  const file = "supabase/functions/upload-wrap/index.ts";
  let source = read(file);

  if (!source.includes("parent_slug: string | null;")) {
    requireMarker(source, "  slug: string;\n", "the category type in upload-wrap");
    source = source.replace(
      "  slug: string;\n",
      "  slug: string;\n  parent_slug: string | null;\n",
    );
  }

  if (!source.includes("const requestedParentSlug")) {
    const marker = `  const requestedSlug = cleanSlug(\n    String(formData.get("categorySlug") ?? ""),\n  );`;
    requireMarker(source, marker, "the category slug form field in upload-wrap");
    source = source.replace(
      marker,
      `${marker}\n  const hasParentSlugField = formData.has("parentSlug");\n  const requestedParentSlug = cleanSlug(\n    String(formData.get("parentSlug") ?? ""),\n  );\n  const parentSlug = requestedParentSlug || null;`,
    );
  }

  if (!source.includes("const {\n      data: categoryWithParent")) {
    const marker = "  if (!category) {";
    requireMarker(source, marker, "the category creation block in upload-wrap");
    const updateBlock = `  if (category && hasParentSlugField) {\n    const {\n      data: categoryWithParent,\n      error: parentCategoryError,\n    } = await adminClient\n      .from("catalog_categories")\n      .update({ parent_slug: parentSlug })\n      .eq("id", category.id)\n      .select("*")\n      .single();\n\n    if (parentCategoryError || !categoryWithParent) {\n      return jsonResponse(\n        {\n          error:\n            parentCategoryError?.message ??\n            "The category location could not be saved.",\n        },\n        500,\n      );\n    }\n\n    category = categoryWithParent;\n  }\n\n`;
    source = source.replace(marker, `${updateBlock}${marker}`);
  }

  if (!/slug:\s*requestedSlug,\s*\n\s*parent_slug:\s*parentSlug,/.test(source)) {
    const marker = "          slug: requestedSlug,\n";
    requireMarker(source, marker, "the new category insert in upload-wrap");
    source = source.replace(
      marker,
      `${marker}          parent_slug: parentSlug,\n`,
    );
  }

  write(file, source);
}

function patchMainWrapsPage() {
  const file = "app/wraps/page.tsx";
  let source = read(file);

  if (!source.includes("category.parent_slug === \"sports\"")) {
    const start = source.indexOf("    const sportsCount = sportsChildSlugs.reduce(");
    const endMarker = "    const merged = staticCategories.map((category) => {";
    const end = source.indexOf(endMarker, start);

    if (start === -1 || end === -1) {
      throw new Error("Could not locate the Sports count block in app/wraps/page.tsx.");
    }

    const replacement = `    const allSportsSlugs = new Set<string>([\n      ...sportsChildSlugs,\n      ...liveCategories\n        .filter((category) => category.parent_slug === "sports")\n        .map((category) => category.slug),\n    ]);\n    const sportsCount = Array.from(allSportsSlugs).reduce(\n      (sum, slug) => sum + (liveCounts[slug] ?? 0),\n      0,\n    );\n`;

    source = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
  }

  if (!source.includes('category.parent_slug !== "sports"')) {
    const marker = "          !sportsChildSlugSet.has(category.slug),";
    requireMarker(source, marker, "the dynamic category filter in app/wraps/page.tsx");
    source = source.replace(
      marker,
      `          !sportsChildSlugSet.has(category.slug) &&\n          category.parent_slug !== "sports",`,
    );
  }

  write(file, source);
}

function patchSportsPage() {
  const file = "app/wraps/sports/page.tsx";
  let source = read(file);

  if (!source.includes('import { supabase } from "@/lib/supabase";')) {
    const marker = 'import type { CatalogWrapCounts } from "@/lib/catalogCounts";';
    requireMarker(source, marker, "the catalog-count import in the Sports page");
    source = source.replace(
      marker,
      `${marker}\nimport { supabase } from "@/lib/supabase";\nimport type { CatalogCategoryRecord } from "@/types/catalog";`,
    );
  }

  const startMarker = "export default function SportsWrapsPage() {";
  const endMarker = "  const normalizedSearch";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    throw new Error(
      "Could not locate the component state section in app/wraps/sports/page.tsx.",
    );
  }

  const componentStart = [
    "export default function SportsWrapsPage() {",
    "  const [searchQuery, setSearchQuery] = useState(\"\");",
    "  const [liveCounts, setLiveCounts] = useState<CatalogWrapCounts>({});",
    "  const [liveCategories, setLiveCategories] = useState<",
    "    CatalogCategoryRecord[]",
    "  >([]);",
    "",
    "  useEffect(() => {",
    "    let active = true;",
    "",
    "    const loadSportsCatalog = async () => {",
    "      const [categoryResult, countsResult] = await Promise.allSettled([",
    "        supabase",
    "          .from(\"catalog_categories\")",
    "          .select(\"*\")",
    "          .eq(\"is_active\", true)",
    "          .eq(\"parent_slug\", \"sports\")",
    "          .order(\"display_order\", { ascending: true })",
    "          .order(\"display_name\", { ascending: true }),",
    "        loadCatalogWrapCounts(),",
    "      ]);",
    "",
    "      if (!active) {",
    "        return;",
    "      }",
    "",
    "      if (",
    "        categoryResult.status === \"fulfilled\" &&",
    "        !categoryResult.value.error",
    "      ) {",
    "        setLiveCategories(",
    "          (categoryResult.value.data ?? []) as CatalogCategoryRecord[],",
    "        );",
    "      } else {",
    "        console.error(",
    "          \"Could not load sports team categories.\",",
    "          categoryResult.status === \"rejected\"",
    "            ? categoryResult.reason",
    "            : categoryResult.value.error,",
    "        );",
    "      }",
    "",
    "      if (countsResult.status === \"fulfilled\") {",
    "        setLiveCounts(countsResult.value);",
    "      } else {",
    "        console.error(",
    "          \"Could not load sports wrap counts.\",",
    "          countsResult.reason,",
    "        );",
    "      }",
    "    };",
    "",
    "    void loadSportsCatalog();",
    "",
    "    return () => {",
    "      active = false;",
    "    };",
    "  }, []);",
    "",
    "  const sortedCategories = useMemo(() => {",
    "    const liveBySlug = new Map(",
    "      liveCategories.map((category) => [category.slug, category]),",
    "    );",
    "",
    "    const mergedStatic = sportsCategories.map((category) => {",
    "      const live = liveBySlug.get(category.slug);",
    "",
    "      return {",
    "        ...category,",
    "        title: live?.display_name || category.title,",
    "        description: live?.description || category.description,",
    "        image: live?.card_image_url || category.image,",
    "        keywords: `${category.keywords} ${live?.keywords ?? \"\"}`,",
    "        imageScale: live?.image_scale || category.imageScale,",
    "        baseCount: live?.base_image_count ?? category.baseCount,",
    "        wrapCount:",
    "          liveCounts[category.slug] ??",
    "          live?.base_image_count ??",
    "          category.baseCount,",
    "      };",
    "    });",
    "",
    "    const knownSlugs = new Set(",
    "      sportsCategories.map((category) => category.slug),",
    "    );",
    "",
    "    const dynamicCategories = liveCategories",
    "      .filter((category) => !knownSlugs.has(category.slug))",
    "      .map((category): SportsCategory & { wrapCount: number } => ({",
    "        slug: category.slug,",
    "        title: category.display_name,",
    "        description:",
    "          category.description ||",
    "          `Browse ${category.display_name}-inspired UV-DTF wrap designs.`,",
    "        href: `/wraps/category/?slug=${encodeURIComponent(category.slug)}`,",
    "        image: category.card_image_url || \"/logo.png\",",
    "        fallbackImage: \"/logo.png\",",
    "        keywords: category.keywords,",
    "        imageScale: category.image_scale || \"scale-100\",",
    "        baseCount: category.base_image_count,",
    "        wrapCount:",
    "          liveCounts[category.slug] ?? category.base_image_count,",
    "      }));",
    "",
    "    return [...mergedStatic, ...dynamicCategories].sort(",
    "      (first, second) =>",
    "        second.wrapCount - first.wrapCount ||",
    "        first.title.localeCompare(second.title),",
    "    );",
    "  }, [liveCategories, liveCounts]);",
    "",
  ].join("\n");

  source = `${source.slice(0, start)}${componentStart}${source.slice(end)}`;
  write(file, source);
}

function patchDynamicCategoryPage() {
  const file = "app/wraps/category/page.tsx";
  let source = read(file);

  if (!source.includes("const isSportsCategory =")) {
    const marker = `      const record =\n        data as CatalogCategoryRecord;`;
    requireMarker(source, marker, "the live category record in the dynamic category page");
    source = source.replace(
      marker,
      `${marker}\n      const isSportsCategory =\n        record.parent_slug === "sports";`,
    );
  }

  const oldNavigation = `        backHref: "/wraps",\n        backLabel: "Back to Wraps",\n        footerHref: "/wraps",\n        footerLabel: "Return to Wraps",`;
  const newNavigation = `        backHref: isSportsCategory\n          ? "/wraps/sports"\n          : "/wraps",\n        backLabel: isSportsCategory\n          ? "Back to Sports"\n          : "Back to Wraps",\n        footerHref: isSportsCategory\n          ? "/wraps/sports"\n          : "/wraps",\n        footerLabel: isSportsCategory\n          ? "Return to Sports"\n          : "Return to Wraps",`;

  if (!source.includes("? \"/wraps/sports\"")) {
    requireMarker(source, oldNavigation, "the dynamic category back-navigation fields");
    source = source.replace(oldNavigation, newNavigation);
  }

  write(file, source);
}

function writeSql() {
  const file = "supabase/pnp-sports-nesting-fix.sql";
  const sql = `-- PNP SPORTS NESTING REPAIR\n-- Run this in Supabase Dashboard > SQL Editor.\n-- Safe to run more than once.\n\nalter table public.catalog_categories\n  add column if not exists parent_slug text null;\n\ncreate index if not exists catalog_categories_parent_slug_idx\n  on public.catalog_categories (parent_slug, display_order, display_name);\n\n-- Original Sports teams.\nupdate public.catalog_categories\nset parent_slug = 'sports',\n    updated_at = now()\nwhere slug in (\n  'dodgers',\n  'lakers',\n  'clippers',\n  'celtics',\n  'goldenstate',\n  'nuggets',\n  'bulls'\n);\n\n-- Move the two already-uploaded NFL categories into Sports.\nupdate public.catalog_categories\nset parent_slug = 'sports',\n    updated_at = now()\nwhere slug in (\n    'san-francisco-49ers',\n    'sanfrancisco49ers',\n    '49ers',\n    'los-angeles-rams',\n    'losangelesrams',\n    'rams'\n  )\n   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') in (\n    'sanfrancisco49ers',\n    'losangelesrams'\n  );\n\n-- Slightly zoom the Rams card logo.\nupdate public.catalog_categories\nset image_scale = 'scale-[1.18]',\n    updated_at = now()\nwhere slug in ('los-angeles-rams', 'losangelesrams', 'rams')\n   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') =\n      'losangelesrams';\n\n-- Sports itself remains a top-level category.\nupdate public.catalog_categories\nset parent_slug = null,\n    updated_at = now()\nwhere slug = 'sports';\n`;

  write(file, sql);
}

try {
  patchUploadFunction();
  patchMainWrapsPage();
  patchSportsPage();
  patchDynamicCategoryPage();
  writeSql();

  console.log("\nPNP Sports nesting fix V2 applied successfully.");
  console.log(`Backups saved in ${path.relative(root, backupRoot)}`);
  console.log("Next: run supabase/pnp-sports-nesting-fix.sql in Supabase SQL Editor.");
  console.log("Then deploy upload-wrap and run npm build.");
} catch (error) {
  console.error("\nThe V2 update stopped before completion.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
