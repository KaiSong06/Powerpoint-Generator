"use strict";

const { COLORS, DEFAULT_LOGO_PATH } = require("../theme");

/**
 * Generate the Thank You slide (final slide).
 *
 * Dark charcoal background, large "Thank You" text, logo bottom-left.
 */
function generateThankYou(pres, data) {
  const slide = pres.addSlide();

  // ── Dark charcoal background ─────────────────────────────────────────────
  slide.background = { color: COLORS.DARK_BG };

  // ── "Thank You" text ─────────────────────────────────────────────────────
  slide.addText("Thank You", {
    x: 0.6,
    y: 0.6,
    w: 8.0,
    h: 1.2,
    color: COLORS.TEXT_LIGHT,
    fontFace: "Georgia",
    fontSize: 48,
    bold: true,
  });

  // ── Logo bottom-left ─────────────────────────────────────────────────────
  const logo = data.logoPath || DEFAULT_LOGO_PATH;
  slide.addImage({
    path: logo,
    x: 0.5,
    y: 4.8,
    w: 2.0,
    h: 2.0 * 0.4, // proportional height
  });

  return slide;
}

module.exports = { generateThankYou };
