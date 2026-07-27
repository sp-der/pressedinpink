import { createReadStream } from "node:fs";
import {
  readdir,
  stat,
} from "node:fs/promises";
import path from "node:path";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const REQUIRED_ENVIRONMENT_VARIABLES = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ACCOUNT_ID",
  "R2_BUCKET_NAME",
];

for (const variableName of REQUIRED_ENVIRONMENT_VARIABLES) {
  if (!process.env[variableName]) {
    console.error(
      `Missing required environment variable: ${variableName}`,
    );
    process.exit(1);
  }
}

const requestedCategory = process.argv[2];

if (!requestedCategory) {
  console.error(
    "Usage: node scripts/upload-wraps-to-r2.mjs <category-or-all>",
  );
  console.error(
    "Example: node scripts/upload-wraps-to-r2.mjs bulls",
  );
  process.exit(1);
}

const projectRoot = process.cwd();
const localWrapsDirectory = path.join(
  projectRoot,
  "public",
  "wraps",
);

const r2Client = new S3Client({
  region: "auto",
  endpoint:
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;

const supportedExtensions = new Set([
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
]);

function getContentType(filename) {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";

    case ".webp":
      return "image/webp";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    default:
      return "application/octet-stream";
  }
}

async function directoryExists(directoryPath) {
  try {
    const directoryStats = await stat(directoryPath);
    return directoryStats.isDirectory();
  } catch {
    return false;
  }
}

async function getImageFiles(directoryPath) {
  if (!(await directoryExists(directoryPath))) {
    return [];
  }

  const entries = await readdir(directoryPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      const extension = path
        .extname(entry.name)
        .toLowerCase();

      return supportedExtensions.has(extension);
    })
    .map((entry) => entry.name)
    .sort((firstFilename, secondFilename) =>
      firstFilename.localeCompare(
        secondFilename,
        undefined,
        {
          numeric: true,
        },
      ),
    );
}

async function objectAlreadyExists(objectKey) {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      }),
    );

    return true;
  } catch (error) {
    const statusCode =
      error?.$metadata?.httpStatusCode;

    if (
      statusCode === 404 ||
      error?.name === "NotFound"
    ) {
      return false;
    }

    throw error;
  }
}

async function uploadFile({
  localPath,
  objectKey,
}) {
  if (await objectAlreadyExists(objectKey)) {
    console.log(`Skipped existing: ${objectKey}`);

    return {
      uploaded: false,
      skipped: true,
    };
  }

  const fileStats = await stat(localPath);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: createReadStream(localPath),
      ContentLength: fileStats.size,
      ContentType: getContentType(localPath),
      CacheControl: "public, max-age=86400",
    }),
  );

  console.log(`Uploaded: ${objectKey}`);

  return {
    uploaded: true,
    skipped: false,
  };
}

async function uploadCategory(category) {
  const categoryDirectory = path.join(
    localWrapsDirectory,
    category,
  );

  if (!(await directoryExists(categoryDirectory))) {
    throw new Error(
      `Local category folder does not exist: ${categoryDirectory}`,
    );
  }

  const thumbnailsDirectory = path.join(
    categoryDirectory,
    "thumbnails",
  );

  const originalFilenames =
    await getImageFiles(categoryDirectory);

  const thumbnailFilenames =
    await getImageFiles(thumbnailsDirectory);

  if (originalFilenames.length === 0) {
    throw new Error(
      `No original images were found for ${category}.`,
    );
  }

  if (thumbnailFilenames.length === 0) {
    console.warn(
      `Warning: No thumbnails were found for ${category}.`,
    );
  }

  console.log("");
  console.log(`Uploading category: ${category}`);
  console.log(
    `Originals found: ${originalFilenames.length}`,
  );
  console.log(
    `Thumbnails found: ${thumbnailFilenames.length}`,
  );
  console.log("");

  let uploadedCount = 0;
  let skippedCount = 0;

  for (const filename of originalFilenames) {
    const result = await uploadFile({
      localPath: path.join(
        categoryDirectory,
        filename,
      ),
      objectKey:
        `wraps/${category}/originals/${filename}`,
    });

    uploadedCount += result.uploaded ? 1 : 0;
    skippedCount += result.skipped ? 1 : 0;
  }

  for (const filename of thumbnailFilenames) {
    const result = await uploadFile({
      localPath: path.join(
        thumbnailsDirectory,
        filename,
      ),
      objectKey:
        `wraps/${category}/thumbnails/${filename}`,
    });

    uploadedCount += result.uploaded ? 1 : 0;
    skippedCount += result.skipped ? 1 : 0;
  }

  console.log("");
  console.log(`Finished ${category}`);
  console.log(`Uploaded: ${uploadedCount}`);
  console.log(`Skipped existing: ${skippedCount}`);
}

async function getAllCategories() {
  const entries = await readdir(
    localWrapsDirectory,
    {
      withFileTypes: true,
    },
  );

  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name !== "thumbnails")
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const categories =
    requestedCategory.toLowerCase() === "all"
      ? await getAllCategories()
      : requestedCategory
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean);

  console.log(
    `R2 bucket: ${bucketName}`,
  );

  console.log(
    `Categories: ${categories.join(", ")}`,
  );

  for (const category of categories) {
    try {
      await uploadCategory(category);
    } catch (error) {
      console.error("");
      console.error(
        `Failed to upload category: ${category}`,
      );
      console.error(error);
      process.exitCode = 1;
      return;
    }
  }

  console.log("");
  console.log("R2 upload process complete.");
}

await main();

