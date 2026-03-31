const path = require("path");

// ── Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
  PRIMARY_RED: "E31B23",
  DARK_BG: "2D2D2D",
  TEXT_DARK: "333333",
  TEXT_LIGHT: "FFFFFF",
  TABLE_HEADER: "E31B23",
  ROW_ALT: "F5F5F5",
  GREEN_CHECK: "4CAF50",
};

// ── Fonts ───────────────────────────────────────────────────────────────────
const FONTS = {
  HEADER: "Arial",
  BODY: "Calibri",
};

// ── Slide dimensions (16:9) ─────────────────────────────────────────────────
const SLIDE = {
  W: 10,
  H: 5.625,
};

// ── Header bar (black bar at top of content slides) ─────────────────────────
const HEADER_BAR = {
  H: 0.55,
  Y: 0,
};

// ── Logo position (content slides — top-right) ─────────────────────────────
const LOGO = {
  X: 8.5,
  Y: 0.08,
  W: 1.4,
};

// ── Floor plan thumbnail position ───────────────────────────────────────────
const FLOOR_PLAN = {
  X: 0.5,
  Y: 1.0,
  W: 4.0,
};

// ── Logo paths ─────────────────────────────────────────────────────────────
// Light logo (white text) for dark backgrounds: cover, thank you slides
// Dark logo (dark text) for light backgrounds: pricing, product slides
const LOGO_LIGHT_PATH = path.resolve(__dirname, "../assets/envirotech-logo-light.png");
const LOGO_DARK_PATH = path.resolve(__dirname, "../assets/envirotech-logo-dark.png");
const DEFAULT_LOGO_PATH = LOGO_DARK_PATH;

// Actual aspect ratios from the source PNGs
const LOGO_LIGHT_ASPECT = 90 / 344;  // h/w ≈ 0.262
const LOGO_DARK_ASPECT = 74 / 260;   // h/w ≈ 0.285

// ── Helper: add the black header bar + title + logo ────────────────────────
function addHeaderBar(slide, logoPath, text) {
  // Full-width black bar
  slide.addShape("rect", {
    x: 0,
    y: HEADER_BAR.Y,
    w: SLIDE.W,
    h: HEADER_BAR.H,
    fill: { color: COLORS.DARK_BG },
  });

  // Header text
  slide.addText(text, {
    x: 0.5,
    y: HEADER_BAR.Y,
    w: 7.5,
    h: HEADER_BAR.H,
    color: COLORS.TEXT_LIGHT,
    fontFace: FONTS.HEADER,
    fontSize: 18,
    bold: true,
    valign: "middle",
  });

  // Logo top-right (light variant — sits on dark header bar)
  const logo = logoPath || LOGO_LIGHT_PATH;
  slide.addImage({
    path: logo,
    x: LOGO.X,
    y: LOGO.Y,
    w: LOGO.W,
    h: LOGO.W * LOGO_LIGHT_ASPECT,
  });
}

// ── Helper: add floor plan thumbnail ────────────────────────────────────────
function addFloorPlan(slide, floorPlanUrl) {
  if (!floorPlanUrl) return;

  slide.addImage({
    path: floorPlanUrl,
    x: FLOOR_PLAN.X,
    y: FLOOR_PLAN.Y,
    w: FLOOR_PLAN.W,
    h: FLOOR_PLAN.W * 0.65, // approximate aspect ratio for floor plans
  });
}

module.exports = {
  COLORS,
  FONTS,
  SLIDE,
  HEADER_BAR,
  LOGO,
  FLOOR_PLAN,
  DEFAULT_LOGO_PATH,
  LOGO_LIGHT_PATH,
  LOGO_DARK_PATH,
  LOGO_LIGHT_ASPECT,
  LOGO_DARK_ASPECT,
  addHeaderBar,
  addFloorPlan,
};
