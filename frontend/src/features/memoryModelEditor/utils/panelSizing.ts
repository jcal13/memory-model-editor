// Preferred widths are layout choices, not measurements of a particular display.
export const DEFAULT_INFO_PANEL_WIDTH = 380;
export const MIN_INFO_PANEL_WIDTH = 320;
export const MIN_PALETTE_WIDTH = 260;
export const DEFAULT_PALETTE_WIDTH = MIN_PALETTE_WIDTH;
export const MAX_INFO_PANEL_VIEWPORT_RATIO = 2 / 3;
export const PREFERRED_CANVAS_WIDTH = 780;
export const CANVAS_SHARE = 0.5;
export const RESIZE_HANDLE_SIZE = 8;

/** Reserve useful canvas space without forcing the editor beyond the viewport. */
export function maxInformationWidth(containerWidth: number, viewportWidth: number) {
  const canvasWidth = Math.min(PREFERRED_CANVAS_WIDTH, containerWidth * CANVAS_SHARE);
  return Math.max(0, Math.min(viewportWidth * MAX_INFO_PANEL_VIEWPORT_RATIO,
    containerWidth - canvasWidth - RESIZE_HANDLE_SIZE));
}
