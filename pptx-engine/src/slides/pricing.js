"use strict";

const { COLORS, FONTS, addHeaderBar } = require("../theme");

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

// Max product rows per pricing slide before paginating
const MAX_ROWS_PER_SLIDE = 14;

/**
 * Build one pricing slide with the given product rows.
 * @param {object} pres  - PptxGenJS instance
 * @param {object} data  - full payload
 * @param {Array}  rows  - subset of data.products for this slide
 * @param {number} pageIndex - 0-based page number (for multi-page)
 * @param {number} totalPages - total pricing pages
 */
function buildPricingSlide(pres, data, rows, pageIndex, totalPages) {
  const slide = pres.addSlide();

  // ── Header bar ───────────────────────────────────────────────────────────
  const title = totalPages > 1 ? `PRICING (${pageIndex + 1}/${totalPages})` : "PRICING";
  addHeaderBar(slide, data.logoPath, title);

  // ── LEFT SIDE ────────────────────────────────────────────────────────────

  // "Project Summary" label
  slide.addText("Project Summary", {
    x: 0.5,
    y: 0.75,
    w: 2.0,
    h: 0.25,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.BODY,
    fontSize: 12,
    bold: true,
  });

  // Thin red underline below "Project Summary"
  slide.addShape("line", {
    x: 0.5,
    y: 1.0,
    w: 1.5,
    h: 0,
    line: { color: COLORS.PRIMARY_RED, width: 1.5 },
  });

  // Address
  slide.addText(data.officeAddress, {
    x: 0.5,
    y: 1.1,
    w: 4.2,
    h: 0.5,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 28,
    bold: true,
  });

  // Suite number
  slide.addText(data.suiteNumber, {
    x: 0.5,
    y: 1.65,
    w: 4.2,
    h: 0.35,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 18,
  });

  // Red labels
  slide.addText("PROJECT COST", {
    x: 0.5,
    y: 2.2,
    w: 1.5,
    h: 0.2,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: 10,
    bold: true,
  });

  slide.addText("SQ FT COST", {
    x: 2.2,
    y: 2.2,
    w: 1.5,
    h: 0.2,
    color: COLORS.PRIMARY_RED,
    fontFace: FONTS.BODY,
    fontSize: 10,
    bold: true,
  });

  // Total cost
  slide.addText(fmtWhole(data.totalCost), {
    x: 0.5,
    y: 2.45,
    w: 1.7,
    h: 0.55,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 36,
    bold: true,
  });

  // Cost per sqft
  slide.addText(fmtPrice(data.costPerSqFt), {
    x: 2.2,
    y: 2.45,
    w: 1.7,
    h: 0.55,
    color: COLORS.TEXT_DARK,
    fontFace: FONTS.HEADER,
    fontSize: 36,
    bold: true,
  });

  // "FOR XXXX SQ FT"
  slide.addText(`FOR ${data.sqFt.toLocaleString("en-US")} SQ FT`, {
    x: 0.5,
    y: 3.05,
    w: 1.7,
    h: 0.2,
    color: "777777",
    fontFace: FONTS.BODY,
    fontSize: 9,
  });

  // "PER SQ FT"
  slide.addText("PER SQ FT", {
    x: 2.2,
    y: 3.05,
    w: 1.5,
    h: 0.2,
    color: "777777",
    fontFace: FONTS.BODY,
    fontSize: 9,
  });

  // Floor plan image
  if (data.floorPlanUrl) {
    slide.addImage({
      path: data.floorPlanUrl,
      x: 0.5,
      y: 3.4,
      w: 4.0,
      h: 4.0 * 0.65,
    });
  }

  // ── RIGHT SIDE — Product table ───────────────────────────────────────────
  const tableX = 5.2;
  const tableY = 0.75;
  const colWidths = [2.0, 0.8, 1.0, 1.2]; // Room/Area, Quantity, Price, Extended

  // Build table data: header + product rows + total row
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
    y: tableY,
    colW: colWidths,
    rowH: 0.28,
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
