// Keep the default size while limiting the visible effect of native browser zoom.
export const BASE_UI_SCALE = 0.9;
export const MIN_UI_SCALE = 0.5;
export const MAX_UI_SCALE = 1.25;

// Common OS display scales and Chrome page-zoom steps; thirds use their exact ratios.
const SCREEN_SCALES = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const CHROME_ZOOMS = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];

// Browser dimensions are rounded to whole CSS pixels; DPR has floating-point noise.
const METRIC_ROUNDING_PX = 1;
const DPR_RELATIVE_TOLERANCE = 0.0001;

export type ZoomMetrics = Pick<Window,
  'devicePixelRatio' | 'outerWidth' | 'innerWidth' | 'outerHeight' | 'innerHeight'>;

// A sidebar reduces width and bottom-docked tools reduce height. Use both axes,
// then keep only display/zoom pairs that reproduce DPR and fit inside the window.
// No measurements are remembered, so a zoomed reload uses the same calculation.
export function getBrowserZoom(metrics: ZoomMetrics = window) {
  const { devicePixelRatio, outerWidth, innerWidth, outerHeight, innerHeight } = metrics;
  const fits = (outer: number, inner: number, zoom: number) =>
    outer > 0 && inner > METRIC_ROUNDING_PX &&
    zoom * (inner - METRIC_ROUNDING_PX) <= outer;
  const candidates = SCREEN_SCALES.flatMap(screenScale =>
    CHROME_ZOOMS.filter(z =>
      Math.abs(screenScale * z - devicePixelRatio) <= devicePixelRatio * DPR_RELATIVE_TOLERANCE &&
      fits(outerWidth, innerWidth, z) && fits(outerHeight, innerHeight, z)
    ).map(z => ({ screenScale, z }))
  );
  // Prefer the closest fit. If emulation or an unsupported display scale produces
  // no valid pair, leave native zoom alone instead of applying a guessed correction.
  const detected = candidates.sort((a, b) => b.z - a.z)[0];
  const z = detected?.z ?? 1;
  const appliedZoom = detected
    ? BASE_UI_SCALE * Math.max(MIN_UI_SCALE, Math.min(MAX_UI_SCALE, z)) / z
    : BASE_UI_SCALE;
  return { devicePixelRatio, outerWidth, innerWidth, outerHeight, innerHeight, screenScale: detected?.screenScale ?? null, z, appliedZoom,
    detected: Boolean(detected) };
}

/** Convert pointer/viewport measurements to the scaled UI's layout coordinates. */
export function uiScale(): number {
  return Number(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1;
}

/** Use the browser's SVG transform so root zoom, canvas zoom and offsets all count. */
export function screenToCanvas(svg: SVGSVGElement, x: number, y: number) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  return point.matrixTransform(matrix.inverse());
}
