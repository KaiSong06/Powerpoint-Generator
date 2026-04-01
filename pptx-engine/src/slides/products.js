"use strict";

const { COLORS, FONTS, addHeaderBar } = require("../theme");
const { layoutOneProduct } = require("../layouts/oneProduct");
const { layoutTwoProducts } = require("../layouts/twoProducts");
const { layoutThreeProducts } = require("../layouts/threeProducts");

// Category display names
const CATEGORY_LABELS = {
  cafe_furniture: "Café Furniture",
  conference_seating: "Conference Seating",
  guest_seating: "Guest Seating",
  lounge: "Lounge",
  meeting_table: "Meeting Tables",
  office_suite: "Office Suite",
  task_seating: "Task Seating",
  workstation: "Workstations",
};

// Workstation = 1 per slide; everything else = up to 3
const PRODUCTS_PER_SLIDE = { workstation: 1 };
const DEFAULT_PER_SLIDE = 3;

function getMaxPerSlide(category) {
  return PRODUCTS_PER_SLIDE[category] || DEFAULT_PER_SLIDE;
}

/**
 * Group products by category, preserving insertion order.
 */
function groupByCategory(products) {
  const groups = {};
  const order = [];
  for (const p of products) {
    const cat = p.category || "other";
    if (!groups[cat]) {
      groups[cat] = [];
      order.push(cat);
    }
    groups[cat].push(p);
  }
  return { groups, order };
}

/**
 * Chunk an array into sub-arrays of maxSize.
 */
function chunk(arr, maxSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += maxSize) {
    chunks.push(arr.slice(i, i + maxSize));
  }
  return chunks;
}

/**
 * Generate all product slides.
 *
 * Groups products by category, chunks each group by the per-category limit,
 * then renders each chunk with the appropriate 1/2/3-product layout.
 */
function addProductSlides(pres, data) {
  const products = data.products || [];
  if (products.length === 0) return;

  const { groups, order } = groupByCategory(products);

  for (const category of order) {
    const catProducts = groups[category];
    const maxPerSlide = getMaxPerSlide(category);
    const slides = chunk(catProducts, maxPerSlide);
    const catLabel = CATEGORY_LABELS[category] || category;

    for (const slideProducts of slides) {
      const slide = pres.addSlide();

      // Header bar
      addHeaderBar(slide, data.logoPath, "PROPOSED SOLUTIONS");

      // Category subtitle: "Category | Subcategory" (dark bold | red italic)
      const firstProduct = slideProducts[0];
      const subtitle = [
        { text: `${catLabel} `, options: { color: COLORS.TEXT_DARK, fontFace: FONTS.BODY, fontSize: 11, bold: true } },
        { text: "| ", options: { color: COLORS.TEXT_DARK, fontFace: FONTS.BODY, fontSize: 11 } },
        { text: catLabel, options: { color: COLORS.PRIMARY_RED, fontFace: FONTS.BODY, fontSize: 11 } },
      ];
      slide.addText(subtitle, {
        x: 0.5,
        y: 0.65,
        w: 8.0,
        h: 0.22,
      });

      // Select layout based on product count
      if (slideProducts.length === 1) {
        layoutOneProduct(slide, slideProducts, data.floorPlanUrl);
      } else if (slideProducts.length === 2) {
        layoutTwoProducts(slide, slideProducts, data.floorPlanUrl);
      } else {
        layoutThreeProducts(slide, slideProducts, data.floorPlanUrl);
      }
    }
  }
}

module.exports = { addProductSlides };
