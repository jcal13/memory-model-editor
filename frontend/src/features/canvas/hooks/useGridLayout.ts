import { useEffect, useRef } from "react";
import { CanvasElement } from "../../shared/types";
import { getBoxDimensions } from "../utils/box.renderer";
import { getCallStackBounds } from "../utils/boundary.helpers";
import { GridGeometry, assignCells, cellCenter, freeCell, gridGeometry, nearestCell, rowBottom, stepCell, GRID_GAP } from "../utils/gridLayout";

type Pos = { x: number; y: number };

/** Padding CanvasBox adds around each drawing (see useCanvas). */
const BOX_PADDING = 12;

/**
 * A box's size as drawn, in canvas units, from the <svg> CanvasBox renders
 * (its drawing plus padding). Falls back to the per-type estimate before the
 * box has been drawn. The estimate alone is too small for wide or tall
 * objects, which then overflowed their cells and overlapped.
 */
function drawnSize(svg: SVGSVGElement | null, el: CanvasElement) {
  const box = svg?.querySelector<SVGSVGElement>(`g[data-canvas-box-id="${el.boxId}"] > svg`);
  const w = Number(box?.getAttribute("width"));
  const h = Number(box?.getAttribute("height"));
  if (w > 0 && h > 0) return { width: w - BOX_PADDING * 2, height: h - BOX_PADDING * 2 };
  return getBoxDimensions(el);
}

/** Smallest zoom (matches the toolbar's range). */
const MIN_SCALE = 0.5;

const near = (a: Pos, b: Pos) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;

/**
 * Keeps object boxes snapped to a grid while `enabled` (see utils/gridLayout).
 * Cells live in memory only; turning the grid off leaves boxes where they are.
 */
export function useGridLayout({
  enabled,
  objects,
  setElements,
  svgRef,
  callStackWidth,
  scale,
  onScaleChange,
}: {
  enabled: boolean;
  objects: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  callStackWidth: number;
  /** Canvas zoom; when boxes don't fit, the grid zooms out a step at a time. */
  scale?: number;
  onScaleChange?: (scale: number) => void;
}) {
  const cells = useRef(new Map<number, number>());
  /** Where we last put each box, to tell our moves from the user's. */
  const placed = useRef(new Map<number, Pos>());
  /** The cell centre each box was last placed for (nudges keep it). */
  const anchor = useRef(new Map<number, Pos>());
  /** Rows that fit on the visible canvas (arrow keys stop at the last one). */
  const visibleRows = useRef(Infinity);
  /** viewBox size when we last zoomed out, so we wait for it to change. */
  const zoomedAt = useRef<string | null>(null);
  /** Last zoom seen, and the layout the user zoomed in on (left alone). */
  const lastScale = useRef(scale);
  const userZoomedIn = useRef<string | null>(null);

  /** Column widths and row heights depend on which box is in which cell. */
  const geometry = (
    cellOf: Map<number, number> = cells.current
  ): { g: GridGeometry; rows: number; visibleCells: number } | null => {
    const vb = svgRef.current?.viewBox.baseVal;
    if (!vb || !vb.width || !vb.height) return null;
    const stack = getCallStackBounds(vb.height, 0, 0, callStackWidth);
    const sizes = objects.map((o) => ({ ...drawnSize(svgRef.current, o), cell: cellOf.get(o.boxId) }));
    const g = gridGeometry(sizes, vb.width, stack.x + stack.width);
    let rows = 1;
    while (rows < 500 && rowBottom(g, rows) <= vb.height) rows++;
    return { g, rows, visibleCells: rows * g.cols };
  };

  /**
   * Boxes below the last row that fits (or a column wider than the canvas)
   * would be clamped onto their neighbours, so zoom out one step (to 50% at
   * most). The next pass re-checks once the viewBox has grown. Never zooms in,
   * and if the user zooms in it waits until the layout changes (a box added,
   * moved or resized, or the canvas resized) rather than undoing their zoom.
   */
  const zoomOutIfCrowded = (layout: { g: GridGeometry; visibleCells: number }, cellOf: Map<number, number>) => {
    const svg = svgRef.current;
    const vb = svg?.viewBox.baseVal;
    const content = [
      svg?.clientWidth,
      svg?.clientHeight,
      ...objects.map((o) => {
        const size = drawnSize(svg ?? null, o);
        return `${o.boxId}:${cellOf.get(o.boxId)}:${Math.round(size.width)}x${Math.round(size.height)}`;
      }),
    ].join("|");
    if (scale !== undefined && lastScale.current !== undefined && scale > lastScale.current) {
      userZoomedIn.current = content;
    }
    lastScale.current = scale;
    if (userZoomedIn.current === content) return;
    userZoomedIn.current = null;
    if (!vb || !onScaleChange || scale === undefined || scale <= MIN_SCALE + 0.001) return;
    const { g, visibleCells } = layout;
    const width = g.colW.reduce((sum, w) => sum + w + GRID_GAP, g.x0);
    const crowded = width > vb.width || Array.from(cellOf.values()).some((c) => c >= visibleCells);
    const size = `${Math.round(vb.width)}x${Math.round(vb.height)}`;
    if (!crowded || zoomedAt.current === size) return;
    zoomedAt.current = size;
    onScaleChange(Math.max(MIN_SCALE, Math.round((scale - 0.1) * 10) / 10));
  };

  const apply = (targets: Map<number, Pos>) => {
    if (!targets.size) return;
    targets.forEach((p, id) => {
      placed.current.set(id, p);
      anchor.current.set(id, p);
    });
    setElements((prev) =>
      prev.map((el) => {
        const t = targets.get(el.boxId);
        return t && !near(t, el) ? { ...el, x: t.x, y: t.y } : el;
      })
    );
  };

  // Runs after every render; does nothing once everything sits in its cell.
  useEffect(() => {
    if (!enabled) {
      cells.current = new Map();
      placed.current = new Map();
      anchor.current = new Map();
      visibleRows.current = Infinity;
      zoomedAt.current = null;
      userZoomedIn.current = null;
      return;
    }
    const layout = geometry();
    if (!layout) return;
    const { g, visibleCells } = layout;
    const keep = new Set<number>();
    const boxes = objects.map((o) => {
      const last = placed.current.get(o.boxId);
      const prevCell = cells.current.get(o.boxId);
      let moved = !!last && !near(last, o);
      // Small nudges (the canvas clamping a box into view) and boxes in cells
      // below the visible canvas keep their cell and their nudged position.
      if (moved && prevCell !== undefined && (nearestCell(g, o.x, o.y) === prevCell || prevCell >= visibleCells)) {
        moved = false;
        keep.add(o.boxId);
      }
      return { boxId: o.boxId, x: o.x, y: o.y, moved, hasCell: prevCell !== undefined };
    });
    const next = assignCells(boxes, cells.current, g);
    cells.current = next;
    // Sizes follow the new cells (a swap can change column widths and row heights).
    const placedLayout = geometry(next) ?? layout;
    visibleRows.current = placedLayout.rows;
    zoomOutIfCrowded(placedLayout, next);
    const targets = new Map<number, Pos>();
    objects.forEach((o) => {
      const c = cellCenter(placedLayout.g, next.get(o.boxId)!);
      const a = anchor.current.get(o.boxId);
      const p = placed.current.get(o.boxId);
      // Accepted nudge: remember where the box is, keep its cell's anchor.
      if (keep.has(o.boxId)) {
        placed.current.set(o.boxId, { x: o.x, y: o.y });
        return;
      }
      // Already placed for this cell (possibly nudged since): leave it.
      if (a && p && near(a, c) && near(p, o)) return;
      if (!near(c, o)) targets.set(o.boxId, c);
      else {
        placed.current.set(o.boxId, { x: o.x, y: o.y });
        anchor.current.set(o.boxId, c);
      }
    });
    apply(targets);
  });

  /** Arrow key: move a box one cell, swapping with the box already there. */
  const move = (boxId: number, dx: number, dy: number): boolean => {
    const g = geometry()?.g;
    const from = cells.current.get(boxId);
    if (!enabled || !g || from === undefined) return false;
    const to = stepCell(g, from, dx, dy, visibleRows.current);
    if (to === null) return true;
    const occupant = Array.from(cells.current.entries()).find(([, c]) => c === to)?.[0];
    cells.current.set(boxId, to);
    if (occupant !== undefined) cells.current.set(occupant, from);
    // Re-size for the new cells; every box whose cell centre moved follows.
    const after = geometry()?.g ?? g;
    const targets = new Map<number, Pos>();
    cells.current.forEach((cell, id) => {
      const c = cellCenter(after, cell);
      const a = anchor.current.get(id);
      if (id === boxId || id === occupant || !a || !near(a, c)) targets.set(id, c);
    });
    apply(targets);
    return true;
  };

  /** Canvas position of the first empty cell, for a new box. */
  const firstFreeCenter = (): Pos | null => {
    const g = geometry()?.g;
    return enabled && g ? cellCenter(g, freeCell(new Set(cells.current.values()))) : null;
  };

  return { move, firstFreeCenter };
}
