// Synchronizes the canonical portfolio knowledge sources (repo-root `data/`)
// into the Next.js project (`frontend/data/`) so the deployed Vercel app
// always ships the latest git-committed LinkedIn / GitHub knowledge.
//
// Runs automatically via npm `predev`, `prebuild` and `prestart` hooks.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const sourceDir = path.resolve(frontendRoot, "..", "data");
const targetDir = path.join(frontendRoot, "data");

const files = ["linkedin.txt", "github.json"];

function syncFile(filename) {
  const source = path.join(sourceDir, filename);
  const target = path.join(targetDir, filename);
  if (!fs.existsSync(source)) {
    console.warn(`[sync-data] source missing, skipping: ${source}`);
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(source, target);
  console.info(`[sync-data] synced ${source} -> ${target}`);
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`[sync-data] canonical data dir not found: ${sourceDir}`);
  process.exit(1);
}

for (const file of files) {
  syncFile(file);
}
