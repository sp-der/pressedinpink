import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const sourceDirectory = path.join(
  projectRoot,
  "public",
  "wraps",
  "420",
);
const outputDirectory = path.join(sourceDirectory, "thumbnails");

const TOTAL_IMAGES = 15;

await fs.mkdir(outputDirectory, { recursive: true });

for (let number = 1; number <= TOTAL_IMAGES; number += 1) {
  const inputPath = path.join(
    sourceDirectory,
    `420 (${number}).png`,
  );

  const outputPath = path.join(
    outputDirectory,
    `420 (${number}).webp`,
  );

  try {
    await sharp(inputPath)
      .resize({
        width: 1000,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 72,
        effort: 6,
      })
      .toFile(outputPath);

    console.log(`Created thumbnail ${number} of ${TOTAL_IMAGES}`);
  } catch (error) {
    console.error(`Failed on 420 (${number}).png`);
    throw error;
  }
}

console.log(
  `Finished. Thumbnails were saved to: ${outputDirectory}`,
);
