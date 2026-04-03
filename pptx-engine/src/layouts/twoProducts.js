"use strict";

const { COLORS, FONTS } = require("../theme");
const { buildSpecText, renderProductCard } = require("./helpers");

/**
 * Layout for 2 products per slide.
 * Smaller floor plan top-left, two product cards side-by-side on right.
 */
function layoutTwoProducts(slide, products, floorPlanUrl) {
  // Floor plan top-left (smaller: w=3.5)
  if (floorPlanUrl) {
    try {
      slide.addImage({
        path: floorPlanUrl,
        x: 0.5,
        y: 1.0,
        w: 3.5,
        h: 3.5 * 0.65,
      });
    } catch {
      // skip
    }
  }

  // Two product cards side by side on the right
  const cardW = 2.6;
  const cardH = 3.8;
  const startY = 1.0;

  products.forEach((p, i) => {
    const x = i === 0 ? 4.2 : 7.0;
    renderProductCard(slide, p, x, startY, cardW, cardH, {
      imgW: 2.4,
      imgH: 2.0,
      specFontSize: 9,
      specMaxLines: 5,
    });
  });
}

module.exports = { layoutTwoProducts };
