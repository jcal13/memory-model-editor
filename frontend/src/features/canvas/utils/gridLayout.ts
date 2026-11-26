/**
 * Grid layout: object boxes sit in cells to the right of the call stack,
 * filled row by row. A box's place is its cell index; the number of columns
 * follows the canvas width, so indexes reflow when the canvas resizes.
 * Each column is as wide as its widest box and each row as tall as its tallest
 * box, so one long name or tall object doesn't stretch every cell.
 * Positions are box centres (as in CanvasElement.x / y).
 */
export type GridGeometry = {
  x0: number;
  y0: number;
  cols: number;
  /** Column widths and row heights, gaps excluded. Rows past the end are MIN_H. */
  colW: number[];
  rowH: number[];
};

export const GRID_GAP = 28;
export const GRID_MARGIN = 24;
const MIN_W = 120;
const MIN_H = 60;

/** A box's size and, once it has one, its cell. */
export type GridBox = { width: number; height: number; cell?: number };

export function gridGeometry(boxes: GridBox[], canvasWidth: number, callStackRight: number): GridGeometry {
  const x0 = callStackRight + GRID_MARGIN;
  const room = canvasWidth - x0 - GRID_MARGIN / 2;
  const placed = boxes.filter((b) => b.cell !== undefined) as Required<GridBox>[];
  const widths = (cols: number) => {
    const w = new Array<number>(cols).fill(MIN_W);
    placed.forEach((b) => (w[b.cell % cols] = Math.max(w[b.cell % cols], b.width)));
    return w;
  };
  // The most columns whose widths (for the boxes that would land in them) fit.
  let cols = Math.max(1, Math.floor(room / (MIN_W + GRID_GAP)));
  let colW = widths(cols);
  while (cols > 1 && colW.reduce((sum, w) => sum + w + GRID_GAP, 0) > room) colW = widths(--cols);
  const rowH: number[] = [];
  placed.forEach((b) => {
    const r = Math.floor(b.cell / cols);
    for (let i = rowH.length; i <= r; i++) rowH.push(MIN_H);
    rowH[r] = Math.max(rowH[r], b.height);
  });
  return { x0, y0: GRID_MARGIN, cols, colW, rowH };
}

const rowHeight = (g: GridGeometry, r: number) => g.rowH[r] ?? MIN_H;

/** Left edge of column `c` (including its half-gap) and top edge of row `r`. */
function colLeft(g: GridGeometry, c: number) {
  let x = g.x0;
  for (let i = 0; i < c; i++) x += g.colW[i] + GRID_GAP;
  return x;
}
function rowTop(g: GridGeometry, r: number) {
  let y = g.y0;
  for (let i = 0; i < r; i++) y += rowHeight(g, i) + GRID_GAP;
  return y;
}

/** Bottom edge of row `r` (gap included), for counting the rows that fit. */
export function rowBottom(g: GridGeometry, r: number) {
  return rowTop(g, r) + rowHeight(g, r) + GRID_GAP;
}

export function cellCenter(g: GridGeometry, index: number): { x: number; y: number } {
  const col = index % g.cols;
  const row = Math.floor(index / g.cols);
  return {
    x: colLeft(g, col) + (g.colW[col] + GRID_GAP) / 2,
    y: rowTop(g, row) + (rowHeight(g, row) + GRID_GAP) / 2,
  };
}

/** The cell index under a point (clamped to the grid's columns, rows ≥ 0). */
export function nearestCell(g: GridGeometry, x: number, y: number): number {
  let col = 0;
  while (col < g.cols - 1 && x >= colLeft(g, col + 1)) col++;
  let row = 0;
  while (y >= rowTop(g, row + 1)) row++;
  return row * g.cols + col;
}

/** The lowest free cell index, preferring `near` if given. */
export function freeCell(taken: Set<number>, g?: GridGeometry, near?: { x: number; y: number }): number {
  if (g && near) {
    const n = nearestCell(g, near.x, near.y);
    if (!taken.has(n)) return n;
  }
  let i = 0;
  while (taken.has(i)) i++;
  return i;
}

/**
 * The cell one step from `index`, or null at an edge: no wrapping between
 * rows, and no moving below row `rows - 1` (the last row the canvas shows).
 */
export function stepCell(
  g: GridGeometry,
  index: number,
  dx: number,
  dy: number,
  rows = Infinity
): number | null {
  const col = (index % g.cols) + dx;
  const row = Math.floor(index / g.cols) + dy;
  if (col < 0 || col >= g.cols || row < 0) return null;
  // A box already below the visible rows may still move up, not further down.
  if (dy > 0 && row >= rows) return null;
  return row * g.cols + col;
}

/**
 * Assign cells: boxes keep their cell unless they moved (then they go to the
 * cell under them, swapping with its occupant); boxes without a cell take the
 * first free one (or the one under them when `placeNear` is set).
 */
export function assignCells(
  boxes: { boxId: number; x: number; y: number; moved: boolean; hasCell: boolean }[],
  previous: Map<number, number>,
  g: GridGeometry
): Map<number, number> {
  const next = new Map<number, number>();
  // Boxes that stayed keep their cells.
  boxes.forEach((b) => {
    if (b.hasCell && !b.moved && previous.has(b.boxId)) next.set(b.boxId, previous.get(b.boxId)!);
  });
  // Moved boxes go to the cell under them; its occupant takes their old cell.
  boxes
    .filter((b) => b.moved && previous.has(b.boxId))
    .forEach((b) => {
      const target = nearestCell(g, b.x, b.y);
      const old = previous.get(b.boxId)!;
      const occupant = Array.from(next.entries()).find(([id, cell]) => cell === target && id !== b.boxId)?.[0];
      if (occupant !== undefined) {
        const taken = new Set(next.values());
        taken.delete(target);
        next.set(occupant, taken.has(old) ? freeCell(new Set([...Array.from(taken), target])) : old);
      }
      next.set(b.boxId, target);
    });
  // New boxes: when the grid is first turned on, pack them in reading order;
  // later (a drop), use the cell under the box if it's free.
  const packing = previous.size === 0;
  boxes
    .filter((b) => !next.has(b.boxId))
    .sort((a, b) => (Math.abs(a.y - b.y) <= 24 ? a.x - b.x : a.y - b.y))
    .forEach((b) => next.set(b.boxId, freeCell(new Set(next.values()), packing ? undefined : g, { x: b.x, y: b.y })));
  return next;
}
