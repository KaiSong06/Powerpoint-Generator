"use strict";

const { COLORS, FONTS, SLIDE, DEFAULT_LOGO_PATH } = require("../theme");

/**
 * Format a date as "Month DD, YYYY"
 */
function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate the cover slide (Slide 1).
 *
 * Full-bleed background image, semi-transparent overlay,
 * logo top-left, client info bottom-left.
 */
function generateCover(pres, data) {
  const slide = pres.addSlide();

  // ── Full-bleed background image ──────────────────────────────────────────
  if (data.coverImagePath) {
    slide.addImage({
      path: data.coverImagePath,
      x: 0,
      y: 0,
      w: SLIDE.W,
      h: SLIDE.H,
      sizing: { type: "cover", w: SLIDE.W, h: SLIDE.H },
    });
  }

  // ── Semi-transparent dark overlay (~30% opacity) ─────────────────────────
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE.W,
    h: SLIDE.H,
    fill: { color: "000000", transparency: 30 },
  });

  // ── Logo top-left ────────────────────────────────────────────────────────
  const logo = data.logoPath || DEFAULT_LOGO_PATH;
  slide.addImage({
    path: logo,
    x: 0.4,
    y: 0.3,
    w: 2.5,
    h: 2.5 * 0.4, // proportional height
  });

  // ── Client name ──────────────────────────────────────────────────────────
  slide.addText(data.clientName, {
    x: 0.5,
    y: 3.6,
    w: 6.0,
    h: 0.55,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.HEADER,
    fontSize: 36,
    bold: true,
  });

  // ── Office address ───────────────────────────────────────────────────────
  slide.addText(data.officeAddress, {
    x: 0.5,
    y: 4.2,
    w: 6.0,
    h: 0.3,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.BODY,
    fontSize: 14,
  });

  // ── Red separator line ───────────────────────────────────────────────────
  slide.addShape("line", {
    x: 0.5,
    y: 4.5,
    w: 1.0,
    h: 0,
    line: { color: COLORS.PRIMARY_RED, width: 2 },
  });

  // ── Date ─────────────────────────────────────────────────────────────────
  slide.addText(formatDate(data.date), {
    x: 0.5,
    y: 4.6,
    w: 3.0,
    h: 0.2,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.BODY,
    fontSize: 12,
  });

  // ── Consultant info (name / email / phone stacked) ───────────────────────
  const c = data.consultant;
  const consultantLines = [c.name, c.email, c.phone].filter(Boolean);

  slide.addText(
    consultantLines.map((line, i) => ({
      text: line,
      options: {
        breakLine: i < consultantLines.length - 1,
        color: COLORS.TEXT_LIGHT,
        fontFace: FONTS.BODY,
        fontSize: 10,
      },
    })),
    {
      x: 0.5,
      y: 4.85,
      w: 4.0,
      h: 0.6,
    }
  );

  return slide;
}

module.exports = { generateCover };
