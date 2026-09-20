import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const chunksDir = join(root, "assets", "blank-cups");
const outputRoot = join(root, "public", "blank-cups");

if (!existsSync(chunksDir)) {
  console.error("Blank cup asset chunks are missing.");
  process.exit(1);
}

const chunkFiles = readdirSync(chunksDir)
  .filter((name) => /^part-\d+\.b64$/.test(name))
  .sort();

if (chunkFiles.length === 0) {
  console.error("No blank cup asset chunks were found.");
  process.exit(1);
}

const encoded = chunkFiles
  .map((name) => readFileSync(join(chunksDir, name), "utf8").trim())
  .join("");
const tar = gunzipSync(Buffer.from(encoded, "base64"));

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

let offset = 0;
let written = 0;

while (offset + 512 <= tar.length) {
  const header = tar.subarray(offset, offset + 512);

  if (header.every((byte) => byte === 0)) {
    break;
  }

  const readString = (start, end) =>
    header
      .subarray(start, end)
      .toString("utf8")
      .replace(/\0.*$/, "")
      .trim();

  const name = readString(0, 100);
  const prefix = readString(345, 500);
  const relativePath = (prefix ? `${prefix}/${name}` : name)
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  const size = parseInt(readString(124, 136) || "0", 8) || 0;
  const type = String.fromCharCode(header[156] || 48);
  const dataStart = offset + 512;
  const dataEnd = dataStart + size;

  const parts = relativePath.split("/").filter(Boolean);
  const unsafe =
    relativePath.includes("\0") ||
    parts.some((part) => part === ".." || part === ".");

  if (unsafe) {
    throw new Error(`Unsafe blank cup asset path: ${relativePath}`);
  }

  if ((type === "0" || type === "\0") && parts.length > 0) {
    const target = join(outputRoot, ...parts);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, tar.subarray(dataStart, dataEnd));
    written += 1;
  }

  offset = dataStart + Math.ceil(size / 512) * 512;
}

if (written !== 61) {
  throw new Error(`Expected 61 blank cup assets, materialized ${written}.`);
}

console.log(`Materialized ${written} blank cup assets.`);
