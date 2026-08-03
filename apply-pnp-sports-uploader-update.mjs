#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = ["package.json", "app", "supabase", "types"];

for (const entry of required) {
  if (!fs.existsSync(path.join(root, entry))) {
    console.error(`Run this script from the Pressed In Pink repository root. Missing: ${entry}`);
    process.exit(1);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".pnp-backups", `sports-uploader-${timestamp}`);

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function patchFile(relativePath, operations) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${relativePath}`);
  }

  const original = fs.readFileSync(filePath, "utf8");
  let source = normalize(original);
  let changed = false;

  for (const operation of operations) {
    if (operation.already && source.includes(operation.already)) {
      continue;
    }

    if (!source.includes(operation.search)) {
      throw new Error(
        `Could not find the expected section for “${operation.label}” in ${relativePath}. ` +
          "The repository may have changed since this update package was created.",
      );
    }

    source = source.replace(operation.search, operation.replacement);
    changed = true;
  }

  if (!changed) {
    console.log(`Already updated: ${relativePath}`);
    return;
  }

  const backupPath = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, original, "utf8");
  fs.writeFileSync(filePath, source, "utf8");
  console.log(`Updated: ${relativePath}`);
}

try {
  patchFile("types/catalog.ts", [
    {
      label: "catalog parent field",
      already: "  parent_slug: string | null;",
      search: "  slug: string;\n  display_name: string;",
      replacement: "  slug: string;\n  parent_slug: string | null;\n  display_name: string;",
    },
  ]);

  patchFile("app/admin/catalog/page.tsx", [
    {
      label: "new category parent state",
      already: "const [categoryParentSlug, setCategoryParentSlug]",
      search:
        "  const [creatingCategory, setCreatingCategory] =\n    useState(false);\n  const [categoryName, setCategoryName] =",
      replacement:
        "  const [creatingCategory, setCreatingCategory] =\n    useState(false);\n  const [categoryParentSlug, setCategoryParentSlug] =\n    useState(\"\");\n  const [categoryName, setCategoryName] =",
    },
    {
      label: "send parent category to uploader",
      already: 'formData.append("parentSlug", categoryParentSlug);',
      search: '    formData.append("keywords", keywords.trim());',
      replacement:
        '    formData.append("keywords", keywords.trim());\n    formData.append("parentSlug", categoryParentSlug);',
    },
    {
      label: "reset category location toggle",
      already: "                setCategoryParentSlug(\"\");\n                setCategoryImageFile(null);",
      search:
        "                setCreatingCategory((current) => !current);\n                setCategoryImageFile(null);",
      replacement:
        "                setCreatingCategory((current) => !current);\n                setCategoryParentSlug(\"\");\n                setCategoryImageFile(null);",
    },
    {
      label: "show sports grouping in existing category list",
      already: 'category.parent_slug === "sports"',
      search: "                    {category.display_name}\n                  </option>",
      replacement:
        '                    {category.parent_slug === "sports"\n                      ? `Sports • ${category.display_name}`\n                      : category.display_name}\n                  </option>',
    },
    {
      label: "category location selector",
      already: "Where should this category appear?",
      search:
        '            <div className="mt-6 grid gap-4 sm:grid-cols-2">\n              <label>\n                <span className="text-sm font-bold">Category name</span>',
      replacement:
        '            <div className="mt-6 grid gap-4 sm:grid-cols-2">\n              <label className="sm:col-span-2">\n                <span className="text-sm font-bold">Where should this category appear?</span>\n                <select\n                  value={categoryParentSlug}\n                  onChange={(event) =>\n                    setCategoryParentSlug(event.target.value)\n                  }\n                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"\n                >\n                  <option value="">Main Wrap Categories</option>\n                  <option value="sports">Sports Team Categories</option>\n                </select>\n                <p className="mt-2 text-xs leading-5 text-white/55">\n                  Sports Team Categories appear inside Sports and stay hidden from the main category grid.\n                </p>\n              </label>\n              <label>\n                <span className="text-sm font-bold">Category name</span>',
    },
    {
      label: "reset location after category image creation",
      already:
        "      setCreatingCategory(false);\n      setCategoryParentSlug(\"\");\n      setCategoryImageFile(null);",
      search:
        "      setCreatingCategory(false);\n      setCategoryImageFile(null);",
      replacement:
        "      setCreatingCategory(false);\n      setCategoryParentSlug(\"\");\n      setCategoryImageFile(null);",
    },
    {
      label: "reset location after wrap publishing",
      already:
        "    if (creatingCategory && completed > 0) {\n      setCreatingCategory(false);\n      setCategoryParentSlug(\"\");",
      search:
        "    if (creatingCategory && completed > 0) {\n      setCreatingCategory(false);\n      setSelectedSlug(uploadSlug);\n    }",
      replacement:
        "    if (creatingCategory && completed > 0) {\n      setCreatingCategory(false);\n      setCategoryParentSlug(\"\");\n      setSelectedSlug(uploadSlug);\n    }",
    },
  ]);

  patchFile("supabase/functions/upload-wrap/index.ts", [
    {
      label: "edge function category parent type",
      already: "  parent_slug: string | null;",
      search: "  slug: string;\n  display_name: string;",
      replacement: "  slug: string;\n  parent_slug: string | null;\n  display_name: string;",
    },
    {
      label: "read and validate parent category",
      already: "const requestedParentSlug = cleanSlug(",
      search:
        '  const requestedSlug = cleanSlug(\n    String(formData.get("categorySlug") ?? ""),\n  );\n  if (\n    action !== "upload-wrap" &&',
      replacement:
        '  const requestedSlug = cleanSlug(\n    String(formData.get("categorySlug") ?? ""),\n  );\n  const requestedParentSlug = cleanSlug(\n    String(formData.get("parentSlug") ?? ""),\n  );\n\n  if (requestedParentSlug && requestedParentSlug !== "sports") {\n    return jsonResponse(\n      { error: "The selected category location is invalid." },\n      400,\n    );\n  }\n\n  if (\n    action !== "upload-wrap" &&',
    },
    {
      label: "store parent category",
      already: "          parent_slug: requestedParentSlug || null,",
      search:
        "          slug: requestedSlug,\n          display_name: displayName.slice(0, 120),",
      replacement:
        "          slug: requestedSlug,\n          parent_slug: requestedParentSlug || null,\n          display_name: displayName.slice(0, 120),",
    },
  ]);

  patchFile("app/wraps/sports/page.tsx", [
    {
      label: "sports live category imports",
      already: 'import { supabase } from "@/lib/supabase";',
      search:
        'import type { CatalogWrapCounts } from "@/lib/catalogCounts";\n',
      replacement:
        'import type { CatalogWrapCounts } from "@/lib/catalogCounts";\nimport { supabase } from "@/lib/supabase";\nimport type { CatalogCategoryRecord } from "@/types/catalog";\n',
    },
    {
      label: "sports live category state",
      already: "const [liveSportsCategories, setLiveSportsCategories]",
      search:
        "  const [liveCounts, setLiveCounts] = useState<CatalogWrapCounts>({});\n",
      replacement:
        "  const [liveCounts, setLiveCounts] = useState<CatalogWrapCounts>({});\n  const [liveSportsCategories, setLiveSportsCategories] = useState<\n    CatalogCategoryRecord[]\n  >([]);\n",
    },
    {
      label: "load sports categories from Supabase",
      already: "Could not load sports team categories.",
      search:
        '  useEffect(() => {\n    let active = true;\n    void loadCatalogWrapCounts()\n      .then((counts) => {\n        if (active) {\n          setLiveCounts(counts);\n        }\n      })\n      .catch((error) => {\n        console.error("Could not load sports wrap counts.", error);\n      });\n\n    return () => {\n      active = false;\n    };\n  }, []);',
      replacement:
        '  useEffect(() => {\n    let active = true;\n\n    const loadSportsCatalog = async () => {\n      const [countsResult, categoriesResult] = await Promise.allSettled([\n        loadCatalogWrapCounts(),\n        supabase\n          .from("catalog_categories")\n          .select("*")\n          .eq("is_active", true)\n          .eq("parent_slug", "sports")\n          .order("display_order", { ascending: true })\n          .order("display_name", { ascending: true }),\n      ]);\n\n      if (!active) {\n        return;\n      }\n\n      if (countsResult.status === "fulfilled") {\n        setLiveCounts(countsResult.value);\n      } else {\n        console.error("Could not load sports wrap counts.", countsResult.reason);\n      }\n\n      if (\n        categoriesResult.status === "fulfilled" &&\n        !categoriesResult.value.error\n      ) {\n        setLiveSportsCategories(\n          (categoriesResult.value.data ?? []) as CatalogCategoryRecord[],\n        );\n      } else {\n        console.error(\n          "Could not load sports team categories.",\n          categoriesResult.status === "rejected"\n            ? categoriesResult.reason\n            : categoriesResult.value.error,\n        );\n      }\n    };\n\n    void loadSportsCatalog();\n\n    return () => {\n      active = false;\n    };\n  }, []);',
    },
    {
      label: "merge static and uploaded sports categories",
      already: "const dynamicSportsCategories = liveSportsCategories",
      search:
        '  const sortedCategories = useMemo(\n    () =>\n      sportsCategories\n        .map((category) => ({\n          ...category,\n          wrapCount: liveCounts[category.slug] ?? category.baseCount,\n        }))\n        .sort(\n          (first, second) =>\n            second.wrapCount - first.wrapCount ||\n            first.title.localeCompare(second.title),\n        ),\n    [liveCounts],\n  );',
      replacement:
        '  const sortedCategories = useMemo(() => {\n    const liveBySlug = new Map(\n      liveSportsCategories.map((category) => [category.slug, category]),\n    );\n    const staticSlugSet = new Set(\n      sportsCategories.map((category) => category.slug),\n    );\n\n    const mergedStaticCategories = sportsCategories.map((category) => {\n      const live = liveBySlug.get(category.slug);\n\n      return {\n        ...category,\n        title: live?.display_name || category.title,\n        description: live?.description || category.description,\n        image: live?.card_image_url || category.image,\n        keywords: `${category.keywords} ${live?.keywords ?? ""}`,\n        imageScale: live?.image_scale || category.imageScale,\n        wrapCount:\n          liveCounts[category.slug] ??\n          live?.base_image_count ??\n          category.baseCount,\n      };\n    });\n\n    const dynamicSportsCategories = liveSportsCategories\n      .filter((category) => !staticSlugSet.has(category.slug))\n      .map((category) => ({\n        slug: category.slug,\n        title: category.display_name,\n        description:\n          category.description ||\n          "Browse newly published sports team wrap designs.",\n        href: `/wraps/category/?slug=${encodeURIComponent(category.slug)}`,\n        image: category.card_image_url || "/logo.png",\n        fallbackImage: "/logo.png",\n        keywords: category.keywords,\n        imageScale: category.image_scale || "scale-100",\n        baseCount: category.base_image_count,\n        wrapCount:\n          liveCounts[category.slug] ?? category.base_image_count,\n      }));\n\n    return [...mergedStaticCategories, ...dynamicSportsCategories].sort(\n      (first, second) =>\n        second.wrapCount - first.wrapCount ||\n        first.title.localeCompare(second.title),\n    );\n  }, [liveCounts, liveSportsCategories]);',
    },
  ]);

  patchFile("app/wraps/page.tsx", [
    {
      label: "include uploaded sports teams in Sports total",
      already: "const liveSportsChildSlugs = liveCategories",
      search:
        '    const sportsCount = sportsChildSlugs.reduce(\n      (sum, slug) => sum + (liveCounts[slug] ?? 0),\n      0,\n    );',
      replacement:
        '    const liveSportsChildSlugs = liveCategories\n      .filter((category) => category.parent_slug === "sports")\n      .map((category) => category.slug);\n    const allSportsChildSlugs = new Set<string>([\n      ...sportsChildSlugs,\n      ...liveSportsChildSlugs,\n    ]);\n    const sportsCount = Array.from(allSportsChildSlugs).reduce(\n      (sum, slug) => sum + (liveCounts[slug] ?? 0),\n      0,\n    );',
    },
    {
      label: "hide uploaded sports teams from main grid",
      already:
        '!sportsChildSlugSet.has(category.slug) &&\n          category.parent_slug !== "sports"',
      search:
        "          !knownSlugs.has(category.slug) &&\n          !sportsChildSlugSet.has(category.slug),",
      replacement:
        '          !knownSlugs.has(category.slug) &&\n          !sportsChildSlugSet.has(category.slug) &&\n          category.parent_slug !== "sports",',
    },
  ]);

  patchFile("app/wraps/category/page.tsx", [
    {
      label: "sports category navigation flag",
      already: 'const isSportsCategory = record.parent_slug === "sports";',
      search:
        "      const record =\n        data as CatalogCategoryRecord;\n      setCategory({",
      replacement:
        '      const record =\n        data as CatalogCategoryRecord;\n      const isSportsCategory = record.parent_slug === "sports";\n\n      setCategory({',
    },
    {
      label: "sports category back links",
      already:
        '        backHref: isSportsCategory ? "/wraps/sports" : "/wraps",',
      search:
        '        backHref: "/wraps",\n        backLabel: "Back to Wraps",\n        footerHref: "/wraps",\n        footerLabel: "Return to Wraps",',
      replacement:
        '        backHref: isSportsCategory ? "/wraps/sports" : "/wraps",\n        backLabel: isSportsCategory ? "Back to Sports" : "Back to Wraps",\n        footerHref: isSportsCategory ? "/wraps/sports" : "/wraps",\n        footerLabel: isSportsCategory ? "Return to Sports" : "Return to Wraps",',
    },
  ]);

  console.log("\nSports subcategory code update applied successfully.");
  console.log(`Backups were saved to: ${path.relative(root, backupRoot)}`);
  console.log("Next: run the included SQL, deploy upload-wrap, and run npm build.");
} catch (error) {
  console.error("\nUpdate stopped before completion.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Any files changed before the error have backups in .pnp-backups.");
  process.exit(1);
}
