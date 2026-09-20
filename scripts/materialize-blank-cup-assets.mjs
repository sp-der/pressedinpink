import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const archivePath = join(
  root,
  "assets",
  "blank-cups",
  "blank-cups.tar.gz",
);
const outputRoot = join(root, "public", "blank-cups");

if (!existsSync(archivePath)) {
  console.error("Blank cup asset archive is missing.");
  process.exit(1);
}

const tar = gunzipSync(readFileSync(archivePath));

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
