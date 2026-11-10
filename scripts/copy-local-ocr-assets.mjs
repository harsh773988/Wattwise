import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = join(projectRoot, "public", "wattwise-ocr");
const assets = [
  [
    join(projectRoot, "node_modules", "tesseract.js", "dist", "worker.min.js"),
    join(destination, "worker.min.js"),
  ],
  [
    join(
      projectRoot,
      "node_modules",
      "tesseract.js-core",
      "tesseract-core-lstm.wasm.js"
    ),
    join(destination, "tesseract-core-lstm.wasm.js"),
  ],
  [
    join(
      projectRoot,
      "node_modules",
      "tesseract.js-core",
      "tesseract-core-lstm.wasm"
    ),
    join(destination, "tesseract-core-lstm.wasm"),
  ],
];

await mkdir(destination, { recursive: true });
await Promise.all(assets.map(([source, target]) => copyFile(source, target)));
