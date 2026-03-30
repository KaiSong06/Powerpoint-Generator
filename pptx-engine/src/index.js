#!/usr/bin/env node
"use strict";

const PptxGenJS = require("pptxgenjs");
const { SLIDE } = require("./theme");
const { generateCover } = require("./slides/cover");
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

  // 3. Create presentation
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.defineLayout({ name: "ENVIROTECH", width: SLIDE.W, height: SLIDE.H });
  pres.layout = "ENVIROTECH";

  // 4. Generate slides
  generateCover(pres, payload);
  process.stderr.write("[pptx-engine] Generated: Cover slide\n");

  // TODO: const { addPricingSlide } = require("./slides/pricing");
  //       addPricingSlide(pres, payload);
  process.stderr.write("[pptx-engine] Would generate: Pricing slide\n");

  // TODO: const { addProductSlides } = require("./slides/products");
  //       addProductSlides(pres, payload);
  process.stderr.write(
    `[pptx-engine] Would generate: Product slides for ${payload.products.length} product(s)\n`
  );

  generateThankYou(pres, payload);
  process.stderr.write("[pptx-engine] Generated: Thank You slide\n");

  // 5. Write file
  await pres.writeFile({ fileName: payload.outputPath });
  process.stderr.write(`[pptx-engine] Written to ${payload.outputPath}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`[pptx-engine] ERROR: ${err.message}\n`);
    process.exit(1);
  });
