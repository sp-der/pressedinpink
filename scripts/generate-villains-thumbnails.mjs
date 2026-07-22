import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const totalImages = 34;
const sourceDirectory = path.join(
  projectRoot,
  "public",
  "wraps",
  "villains",
);
const outputDirectory = path.join(sourceDirectory, "thumbnails");

await fs.mkdir(outputDirectory, { recursive: true });

for (let number = 1; number <= totalImages; number += 1) {
  const inputPath = path.join(
    sourceDirectory,
    `villians (${number}).png`,
  );
  const outputPath = path.join(
    outputDirectory,
    `villians (${number}).webp`,
  );

  try {
    await fs.access(inputPath);

    await sharp(inputPath)
      .rotate(90)
      .resize(1200, 600, {
        fit: "cover",
        position: "centre",
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toFile(outputPath);

    console.log(`Created thumbnail ${number}/${totalImages}`);
  } catch (error) {
    console.error(`Could not process: ${inputPath}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(
    `Finished. Thumbnails are in: ${outputDirectory}`,
  );
}
