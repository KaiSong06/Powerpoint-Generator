"use strict";

const { COLORS, FONTS, SLIDE, LOGO_LIGHT_PATH, LOGO_LIGHT_ASPECT } = require("../theme");

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

// Average characters per inch at given font sizes (Arial approximation)
const CHARS_PER_INCH = { 36: 2.5, 14: 6.0, 12: 7.0, 10: 8.5 };
const LINE_HEIGHT = { 36: 0.52, 14: 0.22, 12: 0.2, 10: 0.16 };

/**
 * Estimate how tall a text block will be given its content, font size, and box width.
 */
function estimateTextHeight(text, fontSize, boxWidth) {
  if (!text) return LINE_HEIGHT[fontSize] || 0.2;
  const cpi = CHARS_PER_INCH[fontSize] || 5;
  const charsPerLine = Math.floor(boxWidth * cpi);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const lh = LINE_HEIGHT[fontSize] || fontSize / 72 * 1.3;
  return lines * lh;
}

/**
 * Generate the cover slide (Slide 1).
 *
 * Full-bleed background image, semi-transparent overlay,
 * logo top-left, client info bottom-left with flow-based positioning.
 */
function generateCover(pres, data) {
  const slide = pres.addSlide();

  const LEFT_X = 0.5;
  const CONTENT_W = 6.0;
  const GAP = 0.08;
  const BOTTOM_PAD = 0.15;

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

  // ── Logo top-left (light variant for dark background) ─────────────────────
  const logoW = 2.5;
  slide.addImage({
    path: LOGO_LIGHT_PATH,
    x: 0.4,
    y: 0.3,
    w: logoW,
    h: logoW * LOGO_LIGHT_ASPECT,
  });

  // ── Bottom-up flow layout for text block ─────────────────────────────────
  // We calculate total height of all elements first, then position them
  // anchored to the bottom of the slide.

  const c = data.consultant;
  const consultantLines = [c.name, c.email, c.phone].filter(Boolean);
  const consultantH = consultantLines.length * (LINE_HEIGHT[10] + 0.02);
  const dateH = LINE_HEIGHT[12];
  const separatorH = 0.02; // line thickness visually
  const addressH = estimateTextHeight(data.officeAddress, 14, CONTENT_W);
  const clientH = estimateTextHeight(data.clientName, 36, CONTENT_W);

  // Total stack height (bottom to top): consultant + date + separator + address + client name + gaps
  const totalH = consultantH + GAP + dateH + GAP + separatorH + GAP + addressH + GAP + clientH;

  // Start the block so it ends at BOTTOM_PAD from the slide bottom
  let cursorY = SLIDE.H - BOTTOM_PAD - totalH;

  // Client name
  slide.addText(data.clientName, {
    x: LEFT_X,
    y: cursorY,
    w: CONTENT_W,
    h: clientH,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.HEADER,
    fontSize: 36,
    bold: true,
    valign: "bottom",
  });
  cursorY += clientH + GAP;

  // Office address
  slide.addText(data.officeAddress, {
    x: LEFT_X,
    y: cursorY,
    w: CONTENT_W,
    h: addressH,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.BODY,
    fontSize: 14,
  });
  cursorY += addressH + GAP;

  // Red separator line
  slide.addShape("line", {
    x: LEFT_X,
    y: cursorY,
    w: 1.0,
    h: 0,
    line: { color: COLORS.PRIMARY_RED, width: 2 },
  });
  cursorY += separatorH + GAP;

  // Date
  slide.addText(formatDate(data.date), {
    x: LEFT_X,
    y: cursorY,
    w: 3.0,
    h: dateH,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.BODY,
    fontSize: 12,
  });
  cursorY += dateH + GAP;

  // Consultant info (name / email / phone stacked)
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
      x: LEFT_X,
      y: cursorY,
      w: 4.0,
      h: consultantH,
    }
  );

  return slide;
}

module.exports = { generateCover };
