"use strict";

const { COLORS, FONTS } = require("../theme");
const { renderProductCard } = require("./helpers");

/**
 * Layout for 3 products per slide.
 * Smaller floor plan top-left, three product cards across the right.
 */
function layoutThreeProducts(slide, products, floorPlanUrl) {
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

  // Three product cards
  const cardW = 1.9;
  const cardH = 3.8;
  const startY = 1.0;
  const positions = [3.6, 5.6, 7.6];

  products.forEach((p, i) => {
    renderProductCard(slide, p, positions[i], startY, cardW, cardH, {
      imgW: 1.7,
      imgH: 1.6,
      specFontSize: 8,
      specMaxLines: 4,
    });
  });
}

module.exports = { layoutThreeProducts };
