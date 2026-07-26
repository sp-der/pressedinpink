import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const categories = [
  { folder: "lakers", prefix: "lakers", totalImages: 14 },
  { folder: "clippers", prefix: "clippers", totalImages: 5 },
  { folder: "celtics", prefix: "celtics", totalImages: 1 },
  { folder: "goldenstate", prefix: "goldenstate", totalImages: 7 },
  { folder: "nuggets", prefix: "nuggets", totalImages: 1 },
  { folder: "bulls", prefix: "bulls", totalImages: 5 },
  { folder: "nightmare", prefix: "nightmare", totalImages: 48 },
  { folder: "pooh", prefix: "pooh", totalImages: 95 },
];

const failures = [];

for (const category of categories) {
  const sourceDirectory = path.join(
    projectRoot,
    "public",
    "wraps",
    category.folder,
  );

  const outputDirectory = path.join(
    sourceDirectory,
    "thumbnails",
  );

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  console.log(
    `\nGenerating ${category.totalImages} ${category.folder} thumbnails...`,
  );

  for (
    let number = 1;
    number <= category.totalImages;
    number += 1
  ) {
    const inputFilename = `${category.prefix} (${number}).png`;
    const outputFilename = `${category.prefix} (${number}).webp`;

    const inputPath = path.join(
      sourceDirectory,
      inputFilename,
    );

    const outputPath = path.join(
      outputDirectory,
      outputFilename,
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

      console.log(
        `Created ${category.folder} thumbnail ${number} of ${category.totalImages}`,
      );
    } catch (error) {
      failures.push(inputPath);
      console.error(`Failed on ${inputFilename}`);
      console.error(error);
    }
  }
}

if (failures.length > 0) {
  console.error("\nThumbnail generation finished with missing or invalid files:");
  failures.forEach((filename) => console.error(`- ${filename}`));
  process.exitCode = 1;
} else {
  console.log("\nFinished generating all new category thumbnails.");
}
