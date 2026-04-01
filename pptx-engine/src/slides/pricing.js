"use strict";

const { COLORS, FONTS, SLIDE, addHeaderBar } = require("../theme");

/**
 * Format a number as $X,XXX.XX
 */
function fmtPrice(val) {
  const n = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]/g, "")) : val;
  if (isNaN(n)) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a number as $X,XXX (no decimals) for large totals
 */
function fmtWhole(val) {
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Max product rows per pricing slide before paginating.
// Table starts at y=0.75 with rowH=0.28. Slide height is 5.625".
// Reserve 0.5" bottom padding → usable = 5.625 - 0.75 - 0.5 = 4.375"
// Subtract header + total rows (2 × 0.28 = 0.56") → 3.815" for product rows
// 3.815 / 0.28 = 13.6 → floor to 10 for safety (text wrapping can expand rows)
const TABLE_Y = 0.75;
const ROW_H = 0.28;
const TABLE_BOTTOM_PAD = 0.5;
const MAX_ROWS_PER_SLIDE = Math.floor(
  (SLIDE.H - TABLE_Y - TABLE_BOTTOM_PAD - 2 * ROW_H) / ROW_H
);

// ── Layout constants ───────────────────────────────────────────────────────
const LEFT_X = 0.5;
const LEFT_W = 4.2;          // width of left column content area
const GAP = 0.08;            // small vertical gap between elements
const BOTTOM_MARGIN = 0.35;  // footer area

// Average character widths in inches per character at various font sizes (Arial approximation)
// These are rough estimates; pptxgenjs wraps text automatically but we need to estimate heights
const CHARS_PER_INCH = {
  28: 3.2,   // ~3.2 chars per inch at 28pt Arial bold
  22: 4.0,
  18: 5.0,
  36: 2.5,
  28: 3.2,
  10: 8.5,
};

const LINE_HEIGHT = {
  28: 0.42,
  22: 0.34,
  18: 0.28,
  36: 0.52,
  12: 0.2,
  10: 0.16,
  9: 0.14,
};

/**
 * Estimate how many lines text will occupy in a given box width at a font size.
 */
function estimateLineCount(text, fontSize, boxWidth) {
  if (!text) return 1;
  const cpi = CHARS_PER_INCH[fontSize] || (fontSize > 20 ? 3.5 : 6);
  const charsPerLine = Math.floor(boxWidth * cpi);
  if (charsPerLine <= 0) return 1;
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

/**
 * Estimate text block height given text content, font size, and box width.
 */
function estimateTextHeight(text, fontSize, boxWidth) {
  const lines = estimateLineCount(text, fontSize, boxWidth);
  const lh = LINE_HEIGHT[fontSize] || fontSize / 72 * 1.3;
  return lines * lh;
}

/**
 * Estimate the rendered width of a string at a given font size.
 */
function estimateTextWidth(text, fontSize) {
  if (!text) return 0;
  const cpi = CHARS_PER_INCH[fontSize] || (fontSize > 20 ? 3.5 : 6);
  return text.length / cpi;
}

/**
 * Choose a font size for the address that fits well in the left column.
 * Long addresses get a smaller font to avoid excessive wrapping.
 */
function pickAddressFontSize(address) {
  if (!address) return 28;
  if (address.length > 50) return 22;
  if (address.length > 35) return 24;
  return 28;
}

/**
 * Choose a font size for dollar amounts that won't collide side-by-side.
 * Both values must fit in LEFT_W with a gap between them.
 */
function pickDollarFontSize(costStr, sqftStr) {
  const w36 = estimateTextWidth(costStr, 36) + estimateTextWidth(sqftStr, 36) + 0.5;
  if (w36 <= LEFT_W) return 36;
  const w28 = estimateTextWidth(costStr, 28) + estimateTextWidth(sqftStr, 28) + 0.5;
  if (w28 <= LEFT_W) return 28;
  return 24;
}

/**
 * Build one pricing slide with the given product rows.
 */
function buildPricingSlide(pres, data, rows, pageIndex, totalPages) {
  const slide = pres.addSlide();

  // ── Header bar ───────────────────────────────────────────────────────────
  const title = totalPages > 1 ? `PRICING (${pageIndex + 1}/${totalPages})` : "PRICING";
  addHeaderBar(slide, data.logoPath, title);

  // ── LEFT SIDE — flow-based vertical layout ──────────────────────────────
  let cursorY = 0.75; // start below header bar

  // "Project Summary" label
  const summaryH = 0.25;
  slide.addText("Project Summary", {
    x: LEFT_X,
    y: cursorY,
    w: 2.0,
    h: summaryH,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.BODY,
    fontSize: 12,
    bold: true,
  });

  // Thin red underline below "Project Summary"
  slide.addShape("line", {
    x: LEFT_X,
    y: cursorY + summaryH,
    w: 1.5,
    h: 0,
    line: { color: COLORS.PRIMARY_RED, width: 1.5 },
  });
  cursorY += summaryH + GAP;

  // Address — adaptive font size
  const addrFontSize = pickAddressFontSize(data.officeAddress);
  const addrH = estimateTextHeight(data.officeAddress, addrFontSize, LEFT_W);
  slide.addText(data.officeAddress, {
    x: LEFT_X,
    y: cursorY,
    w: LEFT_W,
    h: addrH,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: addrFontSize,
    bold: true,
  });
  cursorY += addrH + GAP;

  // Suite number
  const suiteH = 0.3;
  slide.addText(data.suiteNumber, {
    x: LEFT_X,
    y: cursorY,
    w: LEFT_W,
    h: suiteH,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 18,
  });
  cursorY += suiteH + GAP * 2;

  // ── Cost labels + dollar amounts ─────────────────────────────────────────
  const costStr = fmtWhole(data.totalCost);
  const sqftStr = fmtPrice(data.costPerSqFt);
  const dollarFontSize = pickDollarFontSize(costStr, sqftStr);
  const dollarH = LINE_HEIGHT[dollarFontSize] || 0.52;

  // Compute widths for side-by-side placement
  const costW = Math.max(estimateTextWidth(costStr, dollarFontSize) + 0.15, 1.5);
  const sqftX = LEFT_X + costW + 0.2; // gap between the two
  const sqftW = Math.max(estimateTextWidth(sqftStr, dollarFontSize) + 0.15, 1.5);

  // Red labels
  const labelH = 0.2;
  slide.addText("PROJECT COST", {
    x: LEFT_X,
    y: cursorY,
    w: costW,
    h: labelH,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: 10,
    bold: true,
  });

  slide.addText("SQ FT COST", {
    x: sqftX,
    y: cursorY,
    w: sqftW,
    h: labelH,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: 10,
    bold: true,
  });
  cursorY += labelH;

  // Dollar amounts
  slide.addText(costStr, {
    x: LEFT_X,
    y: cursorY,
    w: costW,
    h: dollarH,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: dollarFontSize,
    bold: true,
  });

  slide.addText(sqftStr, {
    x: sqftX,
    y: cursorY,
    w: sqftW,
    h: dollarH,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: dollarFontSize,
    bold: true,
  });
  cursorY += dollarH;

  // "FOR X SQ FT" / "PER SQ FT" subtexts
  const subH = 0.18;
  slide.addText(`FOR ${data.sqFt.toLocaleString("en-US")} SQ FT`, {
    x: LEFT_X,
    y: cursorY,
    w: costW,
    h: subH,
    color: "777777",
    fontFace: FONTS.BODY,
    fontSize: 9,
  });

  slide.addText("PER SQ FT", {
    x: sqftX,
    y: cursorY,
    w: sqftW,
    h: subH,
    color: "777777",
    fontFace: FONTS.BODY,
    fontSize: 9,
  });
  cursorY += subH + GAP * 2;

  // Floor plan image — fill remaining vertical space
  if (data.floorPlanUrl) {
    const availableH = SLIDE.H - cursorY - BOTTOM_MARGIN;
    const fpW = LEFT_W;
    // Cap height to maintain reasonable aspect ratio, use available space
    const fpH = Math.min(availableH, fpW * 0.65);
    if (fpH > 0.5) {
      slide.addImage({
        path: data.floorPlanUrl,
        x: LEFT_X,
        y: cursorY,
        w: fpW,
        h: fpH,
        sizing: { type: "contain", w: fpW, h: fpH },
      });
    }
  }

  // ── Footer: "Envirotech | Client Name" ───────────────────────────────────
  if (data.clientName) {
    slide.addText(
      [
        { text: "Envirotech | ", options: { color: COLORS.TEXT_DARK, fontFace: FONTS.BODY, fontSize: 8 } },
        { text: data.clientName, options: { color: COLORS.PRIMARY_RED, fontFace: FONTS.BODY, fontSize: 8 } },
      ],
      {
        x: SLIDE.W - 3.0,
        y: SLIDE.H - 0.3,
        w: 2.8,
        h: 0.25,
        align: "right",
      }
    );
  }

  // ── RIGHT SIDE — Product table ───────────────────────────────────────────
  const tableX = 5.0;
  const colWidths = [1.8, 0.7, 1.0, 1.2]; // total = 4.7", ends at 9.7"

  const tableRows = [];

  // Header row
  tableRows.push([
    { text: "Room / Area", options: { bold: true, color: COLORS.TEXT_LIGHT, fontSize: 10, fontFace: FONTS.BODY, fill: { color: COLORS.TABLE_HEADER }, align: "left", valign: "middle" } },
    { text: "Quantity",    options: { bold: true, color: COLORS.TEXT_LIGHT, fontSize: 10, fontFace: FONTS.BODY, fill: { color: COLORS.TABLE_HEADER }, align: "center", valign: "middle" } },
    { text: "Price",       options: { bold: true, color: COLORS.TEXT_LIGHT, fontSize: 10, fontFace: FONTS.BODY, fill: { color: COLORS.TABLE_HEADER }, align: "right", valign: "middle" } },
    { text: "Extended",    options: { bold: true, color: COLORS.TEXT_LIGHT, fontSize: 10, fontFace: FONTS.BODY, fill: { color: COLORS.TABLE_HEADER }, align: "right", valign: "middle" } },
  ]);

  // Product rows
  rows.forEach((p, i) => {
    const fillColor = i % 2 === 1 ? COLORS.ROW_ALT : "FFFFFF";
    const rowOpts = { fontSize: 10, fontFace: FONTS.BODY, color: COLORS.TEXT_DARK, fill: { color: fillColor }, valign: "middle" };
    const unitPrice = Number(p.price) || 0;
    const markup = Number(p.markup_percent) || 0;
    const markedUp = unitPrice * (1 + markup / 100);
    const qty = Number(p.quantity) || 1;
    const extended = markedUp * qty;

    tableRows.push([
      { text: p.name,                          options: { ...rowOpts, align: "left" } },
      { text: String(qty),                     options: { ...rowOpts, align: "center" } },
      { text: fmtPrice(markedUp),              options: { ...rowOpts, align: "right" } },
      { text: fmtPrice(extended),              options: { ...rowOpts, align: "right" } },
    ]);
  });

  // Total row
  tableRows.push([
    { text: "",      options: { fontSize: 10, fontFace: FONTS.BODY, bold: true } },
    { text: "",      options: { fontSize: 10, fontFace: FONTS.BODY, bold: true } },
    { text: "Total", options: { fontSize: 10, fontFace: FONTS.BODY, bold: true, color: COLORS.TEXT_DARK, align: "right", valign: "middle" } },
    { text: fmtWhole(data.totalCost), options: { fontSize: 10, fontFace: FONTS.BODY, bold: true, color: COLORS.TEXT_DARK, align: "right", valign: "middle" } },
  ]);

  slide.addTable(tableRows, {
    x: tableX,
    y: TABLE_Y,
    colW: colWidths,
    rowH: ROW_H,
    border: { type: "solid", pt: 0.5, color: "DDDDDD" },
  });

  return slide;
}

/**
 * Generate pricing slide(s). Paginates if more than MAX_ROWS_PER_SLIDE products.
 */
function generatePricing(pres, data) {
  const products = data.products || [];
  if (products.length === 0) return;

  const totalPages = Math.ceil(products.length / MAX_ROWS_PER_SLIDE);

  for (let i = 0; i < totalPages; i++) {
    const start = i * MAX_ROWS_PER_SLIDE;
    const rows = products.slice(start, start + MAX_ROWS_PER_SLIDE);
    buildPricingSlide(pres, data, rows, i, totalPages);
  }
}

module.exports = { generatePricing };
