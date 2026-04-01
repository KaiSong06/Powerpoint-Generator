"use strict";

const { COLORS, FONTS, addFloorPlan } = require("../theme");
const { buildSpecText } = require("./helpers");

/**
 * Layout for 1 product per slide (used for workstation category).
 * Floor plan top-left, specs bottom-left, large product image right half.
 */
function layoutOneProduct(slide, products, floorPlanUrl) {
  // Floor plan top-left (default size: x=0.5, y=1.0, w=4.0)
  addFloorPlan(slide, floorPlanUrl);

  const p = products[0];

  // Large product image — right half
  if (p.image_url) {
    try {
      slide.addImage({
        path: p.image_url,
        x: 5.0,
        y: 1.0,
        w: 4.5,
        h: 3.5,
        sizing: { type: "contain", w: 4.5, h: 3.5 },
      });
    } catch {
      // skip if image fails
    }
  }

  // Product name — bottom left
  slide.addText(p.name, {
    x: 0.5,
    y: 3.2,
    w: 4.2,
    h: 0.5,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 14,
    bold: true,
    italic: true,
  });

  // Thin underline below name
  slide.addShape("line", {
    x: 0.5,
    y: 3.7,
    w: 2.5,
    h: 0,
    line: { color: COLORS.TEXT_DARK, width: 0.5 },
  });

  // "Specifications:" label
  slide.addText("Specifications:", {
    x: 0.5,
    y: 3.8,
    w: 4.2,
    h: 0.22,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.BODY,
    fontSize: 11,
    bold: true,
  });

  // Spec items with red "+" bullets
  const specItems = buildSpecText(p.specifications, 6, 10);
  if (specItems.length > 0) {
    slide.addText(specItems, {
      x: 0.5,
      y: 4.05,
      w: 4.0,
      h: 1.2,
      valign: "top",
      lineSpacingMultiple: 1.15,
    });
  }

  // "Warranty" in red at bottom of specs
  slide.addText("Warranty", {
    x: 0.5,
    y: 5.3,
    w: 2.0,
    h: 0.2,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: 9,
    bold: true,
  });
}

module.exports = { layoutOneProduct };
