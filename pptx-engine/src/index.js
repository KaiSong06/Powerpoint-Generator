#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const http = require("http");
const PptxGenJS = require("pptxgenjs");
const { SLIDE } = require("./theme");
const { generateCover } = require("./slides/cover");
const { generatePricing } = require("./slides/pricing");
const { addProductSlides } = require("./slides/products");
const { generateThankYou } = require("./slides/thankYou");

// ── Required top-level fields ───────────────────────────────────────────────
const REQUIRED_FIELDS = [
  "outputPath",
  "clientName",
  "officeAddress",
  "suiteNumber",
  "sqFt",
  "consultant",
  "products",
  "totalCost",
  "costPerSqFt",
];

// ── Read all of stdin into a string ─────────────────────────────────────────
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}

// ── Validate payload has all required fields ────────────────────────────────
function validate(payload) {
  const missing = REQUIRED_FIELDS.filter((f) => !(f in payload));
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
  if (!Array.isArray(payload.products)) {
    throw new Error("'products' must be an array");
  }
  if (!payload.consultant || typeof payload.consultant !== "object") {
    throw new Error("'consultant' must be an object with name, email, phone");
  }
}

// ── Download a URL to a temp file. Returns local path or null on failure. ───
function downloadImage(url, timeout = 8000) {
  return new Promise((resolve) => {
    const proto = url.startsWith("https") ? https : http;
    const tmpFile = path.join(
      os.tmpdir(),
      `pptx_img_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`
    );
    const file = fs.createWriteStream(tmpFile);

    const req = proto.get(url, { timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect
        file.close();
        fs.unlinkSync(tmpFile);
        resolve(downloadImage(res.headers.location, timeout));
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(tmpFile);
        resolve(null);
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(tmpFile);
      });
    });

    req.on("error", () => {
      file.close();
      try { fs.unlinkSync(tmpFile); } catch {}
      resolve(null);
    });
    req.on("timeout", () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(tmpFile); } catch {}
      resolve(null);
    });
  });
}

// ── Pre-fetch all remote image URLs to local temp files ─────────────────────
async function resolveImages(payload) {
  const tempFiles = [];

  async function resolveUrl(url) {
    if (!url) return null;
    // Already a local file path
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return fs.existsSync(url) ? url : null;
    }
    const localPath = await downloadImage(url);
    if (localPath) tempFiles.push(localPath);
    return localPath;
  }

  // Resolve all images in parallel
  const downloads = payload.products.map((p) =>
    resolveUrl(p.image_url).then((local) => { p.image_url = local; })
  );

  if (payload.floorPlanUrl) {
    downloads.push(
      resolveUrl(payload.floorPlanUrl).then((local) => { payload.floorPlanUrl = local; })
    );
  }

  if (payload.coverImagePath) {
    downloads.push(
      resolveUrl(payload.coverImagePath).then((local) => { payload.coverImagePath = local; })
    );
  }

  await Promise.all(downloads);

  return tempFiles;
}

// ── Cleanup temp files ──────────────────────────────────────────────────────
function cleanupTemp(tempFiles) {
  for (const f of tempFiles) {
    try { fs.unlinkSync(f); } catch {}
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Read & parse JSON from stdin
  const raw = await readStdin();
  if (!raw.trim()) {
    throw new Error("No input received on stdin");
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }

  // 2. Validate
  validate(payload);

  // 3. Pre-fetch remote images to local temp files
  const t0 = Date.now();
  process.stderr.write("[pptx-engine] Resolving images...\n");
  const tempFiles = await resolveImages(payload);
  const resolved = payload.products.filter((p) => p.image_url).length;
  const skipped = payload.products.length - resolved;
  process.stderr.write(
    `[pptx-engine] Images: ${resolved} resolved, ${skipped} skipped\n`
  );

  // 4. Create presentation
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.defineLayout({ name: "ENVIROTECH", width: SLIDE.W, height: SLIDE.H });
  pres.layout = "ENVIROTECH";

  // 5. Generate slides
  const tSlides = Date.now();

  generateCover(pres, payload);
  process.stderr.write("[pptx-engine] Generated: Cover slide\n");

  generatePricing(pres, payload);
  process.stderr.write("[pptx-engine] Generated: Pricing slide(s)\n");

  addProductSlides(pres, payload);
  process.stderr.write(
    `[pptx-engine] Generated: Product slides for ${payload.products.length} product(s)\n`
  );

  generateThankYou(pres, payload);
  process.stderr.write("[pptx-engine] Generated: Thank You slide\n");

  const slideMs = Date.now() - tSlides;
  process.stderr.write(`[pptx-engine] Slide generation: ${slideMs}ms\n`);

  // 6. Write file
  try {
    await pres.writeFile({ fileName: payload.outputPath });
    const totalMs = Date.now() - t0;
    process.stderr.write(`[pptx-engine] Written to ${payload.outputPath}\n`);
    process.stderr.write(`[pptx-engine] Total time: ${totalMs}ms\n`);
  } finally {
    cleanupTemp(tempFiles);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`[pptx-engine] ERROR: ${err.message}\n`);
    process.exit(1);
  });
