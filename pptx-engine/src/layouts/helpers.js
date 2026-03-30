"use strict";

const { COLORS, FONTS } = require("../theme");

/**
 * Build spec lines as pptxgenjs rich text array with red "+" bullets.
 * @param {string} specs - comma-separated spec string
 * @param {number} maxLines - max number of spec lines to show
 * @param {number} fontSize - font size for spec text
 * @returns {Array} rich text array for slide.addText()
 */
function buildSpecText(specs, maxLines, fontSize) {
  if (!specs) return [];
  const items = specs.split(",").map((s) => s.trim()).filter(Boolean);
  const displayItems = items.slice(0, maxLines);
  const result = [];

  displayItems.forEach((item, i) => {
    result.push({
      text: "+  ",
      options: {
        color: COLORS.PRIMARY_RED,
        fontFace: FONTS.BODY,
        fontSize,
        bold: true,
      },
    });
    result.push({
      text: item,
      options: {
        color: COLORS.TEXT_DARK,
        fontFace: FONTS.BODY,
        fontSize,
        breakLine: i < displayItems.length - 1,
      },
    });
  });

  return result;
}

/**
 * Render a product card at the given position.
 * Used by twoProducts and threeProducts layouts.
 *
 * @param {object} slide - pptxgenjs slide
 * @param {object} product - product data object
 * @param {number} x - card left edge
 * @param {number} y - card top edge
 * @param {number} w - card width
 * @param {number} h - card height
 * @param {object} opts - { imgW, imgH, specFontSize, specMaxLines }
 */
function renderProductCard(slide, product, x, y, w, h, opts) {
  const { imgW, imgH, specFontSize, specMaxLines } = opts;

  // Product image (centered within card width)
  if (product.image_url) {
    try {
      const imgX = x + (w - imgW) / 2;
      slide.addImage({
        path: product.image_url,
        x: imgX,
        y,
        w: imgW,
        h: imgH,
        sizing: { type: "contain", w: imgW, h: imgH },
      });
    } catch {
      // skip if image fails
    }
  }

  // Product name (bold, italic, with thin underline)
  const nameY = y + imgH + 0.08;
  slide.addText(product.name, {
    x,
    y: nameY,
    w,
    h: 0.22,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.BODY,
    fontSize: specFontSize + 1,
    bold: true,
    italic: true,
  });

  // Thin underline below name
  slide.addShape("line", {
    x,
    y: nameY + 0.24,
    w: w * 0.9,
    h: 0,
    line: { color: "CCCCCC", width: 0.5 },
  });

  // "Specifications:" label
  const specLabelY = nameY + 0.3;
  slide.addText("Specifications:", {
    x,
    y: specLabelY,
    w,
    h: 0.18,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.BODY,
    fontSize: specFontSize,
    bold: true,
  });

  // Spec list with red "+" bullets
  const specItems = buildSpecText(product.specifications, specMaxLines, specFontSize);
  if (specItems.length > 0) {
    slide.addText(specItems, {
      x: x + 0.02,
      y: specLabelY + 0.2,
      w: w - 0.04,
      h: h - imgH - 1.0,
      valign: "top",
      lineSpacingMultiple: 1.1,
    });
  }

  // "Warranty" in red at bottom of card
  slide.addText("Warranty", {
    x,
    y: y + h - 0.22,
    w,
    h: 0.2,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: specFontSize,
    bold: true,
  });
}

module.exports = { buildSpecText, renderProductCard };
