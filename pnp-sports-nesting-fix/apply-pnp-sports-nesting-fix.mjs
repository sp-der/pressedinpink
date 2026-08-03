import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".pnp-backups", `sports-nesting-fix-${timestamp}`);

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

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) {
    return source;
  }
  if (!source.includes(search)) {
    throw new Error(`Could not find expected section for ${label}. The file may have changed.`);
  }
  return source.replace(search, replacement);
}

function patchUploadFunction() {
  const file = "supabase/functions/upload-wrap/index.ts";
  let source = read(file);

  source = replaceRequired(
    source,
    `  slug: string;\n  display_name: string;`,
    `  slug: string;\n  parent_slug: string | null;\n  display_name: string;`,
    "upload function category type",
  );

  source = replaceRequired(
    source,
    `  const requestedSlug = cleanSlug(\n    String(formData.get("categorySlug") ?? ""),\n  );`,
    `  const requestedSlug = cleanSlug(\n    String(formData.get("categorySlug") ?? ""),\n  );\n  const hasParentSlugField = formData.has("parentSlug");\n  const requestedParentSlug = cleanSlug(\n    String(formData.get("parentSlug") ?? ""),\n  );\n  const parentSlug = requestedParentSlug || null;`,
    "parent category form value",
  );

  source = replaceRequired(
    source,
    `  if (!category) {\n    const displayName = String(`,
    `  if (category && hasParentSlugField) {\n    const {\n      data: categoryWithParent,\n      error: parentCategoryError,\n    } = await adminClient\n      .from("catalog_categories")\n      .update({ parent_slug: parentSlug })\n      .eq("id", category.id)\n      .select("*")\n      .single();\n\n    if (parentCategoryError || !categoryWithParent) {\n      return jsonResponse(\n        {\n          error:\n            parentCategoryError?.message ??\n            "The category location could not be saved.",\n        },\n        500,\n      );\n    }\n\n    category = categoryWithParent;\n  }\n\n  if (!category) {\n    const displayName = String(`,
    "existing category parent update",
  );

  source = replaceRequired(
    source,
    `          slug: requestedSlug,\n          display_name: displayName.slice(0, 120),`,
    `          slug: requestedSlug,\n          parent_slug: parentSlug,\n          display_name: displayName.slice(0, 120),`,
    "new category parent insert",
  );

  write(file, source);
}

function patchMainWrapsPage() {
  const file = "app/wraps/page.tsx";
  let source = read(file);

  source = replaceRequired(
    source,
    `    const sportsCount = sportsChildSlugs.reduce(\n      (sum, slug) => sum + (liveCounts[slug] ?? 0),\n      0,\n    );`,
    `    const allSportsSlugs = new Set<string>([\n      ...sportsChildSlugs,\n      ...liveCategories\n        .filter((category) => category.parent_slug === "sports")\n        .map((category) => category.slug),\n    ]);\n    const sportsCount = Array.from(allSportsSlugs).reduce(\n      (sum, slug) => sum + (liveCounts[slug] ?? 0),\n      0,\n    );`,
    "dynamic sports count",
  );

  source = replaceRequired(
    source,
    `          !knownSlugs.has(category.slug) &&\n          !sportsChildSlugSet.has(category.slug),`,
    `          !knownSlugs.has(category.slug) &&\n          !sportsChildSlugSet.has(category.slug) &&\n          category.parent_slug !== "sports",`,
    "hide sports children from main grid",
  );

  write(file, source);
}

function patchSportsPage() {
  const file = "app/wraps/sports/page.tsx";
  let source = read(file);

  source = replaceRequired(
    source,
    `import type { CatalogWrapCounts } from "@/lib/catalogCounts";`,
    `import type { CatalogWrapCounts } from "@/lib/catalogCounts";\nimport { supabase } from "@/lib/supabase";\nimport type { CatalogCategoryRecord } from "@/types/catalog";`,
    "sports page live catalog imports",
  );

  const oldBlock = `export default function SportsWrapsPage() {\n  const [searchQuery, setSearchQuery] = useState("");\n  const [liveCounts, setLiveCounts] = useState<CatalogWrapCounts>({});\n\n  useEffect(() => {\n    let active = true;\n    void loadCatalogWrapCounts()\n      .then((counts) => {\n        if (active) {\n          setLiveCounts(counts);\n        }\n      })\n      .catch((error) => {\n        console.error("Could not load sports wrap counts.", error);\n      });\n\n    return () => {\n      active = false;\n    };\n  }, []);\n  const sortedCategories = useMemo(\n    () =>\n      sportsCategories\n        .map((category) => ({\n          ...category,\n          wrapCount: liveCounts[category.slug] ?? category.baseCount,\n        }))\n        .sort(\n          (first, second) =>\n            second.wrapCount - first.wrapCount ||\n            first.title.localeCompare(second.title),\n        ),\n    [liveCounts],\n  );`;

  const newBlock = `export default function SportsWrapsPage() {\n  const [searchQuery, setSearchQuery] = useState("");\n  const [liveCounts, setLiveCounts] = useState<CatalogWrapCounts>({});\n  const [liveCategories, setLiveCategories] = useState<\n    CatalogCategoryRecord[]\n  >([]);\n\n  useEffect(() => {\n    let active = true;\n\n    const loadSportsCatalog = async () => {\n      const [categoryResult, countsResult] = await Promise.allSettled([\n        supabase\n          .from("catalog_categories")\n          .select("*")\n          .eq("is_active", true)\n          .eq("parent_slug", "sports")\n          .order("display_order", { ascending: true })\n          .order("display_name", { ascending: true }),\n        loadCatalogWrapCounts(),\n      ]);\n\n      if (!active) {\n        return;\n      }\n\n      if (\n        categoryResult.status === "fulfilled" &&\n        !categoryResult.value.error\n      ) {\n        setLiveCategories(\n          (categoryResult.value.data ?? []) as CatalogCategoryRecord[],\n        );\n      }\n\n      if (countsResult.status === "fulfilled") {\n        setLiveCounts(countsResult.value);\n      }\n    };\n\n    void loadSportsCatalog();\n\n    return () => {\n      active = false;\n    };\n  }, []);\n\n  const sortedCategories = useMemo(() => {\n    const liveBySlug = new Map(\n      liveCategories.map((category) => [category.slug, category]),\n    );\n\n    const mergedStatic = sportsCategories.map((category) => {\n      const live = liveBySlug.get(category.slug);\n\n      return {\n        ...category,\n        title: live?.display_name || category.title,\n        description: live?.description || category.description,\n        image: live?.card_image_url || category.image,\n        fallbackImage: category.fallbackImage,\n        keywords: \`${"${category.keywords} ${live?.keywords ?? \"\"}"}\`,\n        imageScale: live?.image_scale || category.imageScale,\n        baseCount: live?.base_image_count ?? category.baseCount,\n        wrapCount:\n          liveCounts[category.slug] ??\n          live?.base_image_count ??\n          category.baseCount,\n      };\n    });\n\n    const knownSlugs = new Set(\n      sportsCategories.map((category) => category.slug),\n    );\n\n    const dynamicCategories = liveCategories\n      .filter((category) => !knownSlugs.has(category.slug))\n      .map((category): SportsCategory & { wrapCount: number } => ({\n        slug: category.slug,\n        title: category.display_name,\n        description:\n          category.description ||\n          \`Browse ${"${category.display_name}"}-inspired UV-DTF wrap designs.\`,\n        href: \`/wraps/category/?slug=${"${encodeURIComponent(category.slug)}"}\`,\n        image: category.card_image_url || "/logo.png",\n        fallbackImage: "/logo.png",\n        keywords: category.keywords,\n        imageScale: category.image_scale || "scale-100",\n        baseCount: category.base_image_count,\n        wrapCount:\n          liveCounts[category.slug] ?? category.base_image_count,\n      }));\n\n    return [...mergedStatic, ...dynamicCategories].sort(\n      (first, second) =>\n        second.wrapCount - first.wrapCount ||\n        first.title.localeCompare(second.title),\n    );\n  }, [liveCategories, liveCounts]);`;

  source = replaceRequired(
    source,
    oldBlock,
    newBlock,
    "sports page dynamic category merge",
  );

  write(file, source);
}

function patchDynamicCategoryPage() {
  const file = "app/wraps/category/page.tsx";
  let source = read(file);

  source = replaceRequired(
    source,
    `      setCategory({\n        slug: record.slug,`,
    `      const isSportsCategory = record.parent_slug === "sports";\n\n      setCategory({\n        slug: record.slug,`,
    "sports child navigation flag",
  );

  source = replaceRequired(
    source,
    `        backHref: "/wraps",\n        backLabel: "Back to Wraps",\n        footerHref: "/wraps",\n        footerLabel: "Return to Wraps",`,
    `        backHref: isSportsCategory ? "/wraps/sports" : "/wraps",\n        backLabel: isSportsCategory\n          ? "Back to Sports"\n          : "Back to Wraps",\n        footerHref: isSportsCategory ? "/wraps/sports" : "/wraps",\n        footerLabel: isSportsCategory\n          ? "Return to Sports"\n          : "Return to Wraps",`,
    "sports child back navigation",
  );

  write(file, source);
}

function writeSql() {
  const file = "supabase/pnp-sports-nesting-fix.sql";
  const sql = `-- PNP Sports nested category repair\n-- Run this once in Supabase SQL Editor after applying the code update.\n\nalter table public.catalog_categories\n  add column if not exists parent_slug text null;\n\ncreate index if not exists catalog_categories_parent_slug_idx\n  on public.catalog_categories (parent_slug);\n\n-- Keep the original sports teams nested even if older records were created\n-- before parent categories were supported.\nupdate public.catalog_categories\nset parent_slug = 'sports',\n    updated_at = now()\nwhere slug in (\n  'dodgers',\n  'lakers',\n  'clippers',\n  'celtics',\n  'goldenstate',\n  'nuggets',\n  'bulls'\n);\n\n-- Move the two newly uploaded NFL teams into Sports without re-uploading.\nupdate public.catalog_categories\nset parent_slug = 'sports',\n    updated_at = now()\nwhere slug in (\n    'san-francisco-49ers',\n    'sanfrancisco49ers',\n    '49ers',\n    'los-angeles-rams',\n    'losangelesrams',\n    'rams'\n  )\n   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') in (\n    'sanfrancisco49ers',\n    'losangelesrams'\n  );\n\n-- Give the Rams card image a small additional zoom.\nupdate public.catalog_categories\nset image_scale = 'scale-[1.18]',\n    updated_at = now()\nwhere slug in ('los-angeles-rams', 'losangelesrams', 'rams')\n   or regexp_replace(lower(display_name), '[^a-z0-9]+', '', 'g') =\n      'losangelesrams';\n`;

  write(file, sql);
}

try {
  patchUploadFunction();
  patchMainWrapsPage();
  patchSportsPage();
  patchDynamicCategoryPage();
  writeSql();

  console.log("\nPNP Sports nesting fix applied successfully.");
  console.log(`Backups saved in ${path.relative(root, backupRoot)}`);
  console.log("Next: run supabase/pnp-sports-nesting-fix.sql in Supabase SQL Editor.");
  console.log("Then deploy the upload-wrap function and rebuild the site.");
} catch (error) {
  console.error("\nThe update stopped before completion.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
