"use strict";

const { COLORS, LOGO_LIGHT_PATH, LOGO_LIGHT_ASPECT } = require("../theme");

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

  // ── Logo bottom-left (light variant for dark background) ──────────────────
  const logoW = 2.0;
  slide.addImage({
    path: LOGO_LIGHT_PATH,
    x: 0.5,
    y: 4.8,
    w: logoW,
    h: logoW * LOGO_LIGHT_ASPECT,
  });

  return slide;
}

module.exports = { generateThankYou };
