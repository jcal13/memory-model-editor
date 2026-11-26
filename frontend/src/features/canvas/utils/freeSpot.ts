/**
 * A free point (client coordinates) for a new box: the first spot, scanning
 * rows from the top-left of the canvas right of the call stack, that doesn't
 * overlap an existing box.
 */
export function findFreeSpot(svg: SVGSVGElement): { x: number; y: number } | null {
  const area = svg.getBoundingClientRect();
  const stack = svg.querySelector('[data-tour="call-stack"]')?.getBoundingClientRect();
  const taken = Array.from(svg.querySelectorAll("g[data-canvas-box-id]"))
    .filter((g) => g.getAttribute("data-canvas-kind") !== "function")
    .map((g) => g.getBoundingClientRect());
  const halfW = 80, halfH = 45, gap = 16, step = 30;
  const left = Math.max(area.left, stack ? stack.right : area.left) + halfW + gap;
  const right = Math.min(area.right, window.innerWidth) - halfW - gap;
  const bottom = Math.min(area.bottom, window.innerHeight) - halfH - gap;
  const overlap = (x: number, y: number) =>
    taken.reduce((sum, r) => {
      const w = Math.min(x + halfW + gap, r.right) - Math.max(x - halfW - gap, r.left);
      const h = Math.min(y + halfH + gap, r.bottom) - Math.max(y - halfH - gap, r.top);
      return sum + (w > 0 && h > 0 ? w * h : 0);
    }, 0);
  // A full canvas has no clear spot: use the least covered one.
  let best = { x: left, y: area.top + halfH + gap, cover: Infinity };
  for (let y = area.top + halfH + gap; y <= bottom; y += step) {
    for (let x = left; x <= Math.max(left, right); x += step) {
      const cover = overlap(x, y);
      if (cover === 0) return { x, y };
      if (cover < best.cover) best = { x, y, cover };
    }
  }
  return best;
}
