export function isCustomCup(slug: string): boolean {
  return slug.startsWith("custom-cup-");
}

export function customerItemName(slug: string, name: string): string {
  return isCustomCup(slug) ? "Custom Cup Order" : name;
}

// Keep the existing order payload intact, including already-submitted orders.
export function customCupDetails(name: string, category: string) {
  const [cup = "", lid = "", decoration = ""] = name.split("|").map(part => part.trim());
  return {
    cup: cup || "Not specified",
    lid: lid.replace(/\s+lid$/i, "") || "Not specified",
    wrap: category.replace(/^Custom Cup\s*[·—-]\s*Wrap:\s*/i, "") || "Not specified",
    decorated: /^Decorated lid/i.test(decoration),
    decoration: /^Decorated lid/i.test(decoration) ? "Custom decorated lid requested" : decoration || "Not specified",
  };
}
