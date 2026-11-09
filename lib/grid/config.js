// tunables for the homepage grid. data only, no logic.

// colours mirror the site tokens (hero paper + ink)
export const PALETTE = {
  paper: "#f7f5f1",
  ink: "#0d0d0c",
  fallbackBrand: "#174c38", // site brand green
};

// ---- lattice ----
// 1 world unit = 1 css px at zoom 1
export const GRID = {
  CELL: 96, // graph-paper cell
  PITCH_X: 7, // cells per cluster column (5 wide + 2 empty)
  PITCH_Y: 4, // cells per cluster row (2 tall + 2 empty)
  ROW_SHIFT: 3, // odd rows slide right by this many cells
  GAP: 1.5, // px inset per tile edge -> hairline gaps
  LINE_ALPHA: 0.11,
  MIN_COLS: 4,
  MIN_ROWS: 4,
  MAX_COLS: 16,
  MAX_ROWS: 24,
};

// two tile rows per cluster, widths in cells. mirrored on alternate clusters
export const CLUSTER_LAYOUTS = [
  [[0, 0, 2], [2, 0, 1], [3, 0, 2], [0, 1, 1], [1, 1, 2], [3, 1, 2]],
  [[0, 0, 2], [2, 0, 2], [4, 0, 1], [0, 1, 2], [2, 1, 1], [3, 1, 2]],
];
export const CLUSTER_W = 5;
export const CLUSTER_H = 2;

// crop zoom per tile slot: tile 0 is the full frame, the rest read as detail shots
export const CROP_ZOOM = [1, 1.7, 1.3, 2.2, 1.15, 1.85];

// ---- curvature ----
export const CURVE = {
  ANGLE_Y: 0.52, // rad at the top/bottom edge (~30deg)
  ANGLE_X: 0.17, // rad at the left/right edge (~10deg)
  DIST: 1.25, // perspective distance as a multiple of viewport height
  MAX_THETA: 1.35,
  FLAT_IN_FOCUS: 0.15, // curve multiplier while a project is open
  SPEED_BOOST: 0.45, // extra curve at full speed
};

// ---- motion ----
export const MOTION = {
  LERP: 0.08,
  FRICTION: 0.93,
  WHEEL_GAIN: 1,
  CLICK_SLOP: 6,
  SPEED_FOR_FULL_FX: 60, // px/frame that counts as "fast"
  FX_EASE: 0.08,
  HOVER_EASE: 0.16, // ~250ms to settle at 60fps
  DRIFT: 0.25, // px/frame while a panel covers the grid
  ZOOM_MIN: 0.75,
  ZOOM_MAX: 1.35,
};

export const FOCUS = {
  DURATION: 900,
  ZOOM: 1.35,
};

export const INTRO = {
  DURATION: 1400,
  ZOOM_FROM: 0.55,
  CURVE_FROM: 2.2,
};

// ---- textures ----
export const ATLAS = {
  SLOT_W: 512,
  SLOT_H: 288,
  PAD: 4,
  LOAD_WIDTH: 640, // /_next/image width (must be one of next's deviceSizes)
  CONCURRENCY: 6,
};
