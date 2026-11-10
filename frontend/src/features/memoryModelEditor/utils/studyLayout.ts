import { CanvasElement } from "../../shared/types";
import { createBoxRenderer } from "../../canvas/utils/box.renderer";

interface Size { width: number; height: number }

/** Lay out measured objects in centered rows; frames remain in the call stack. */
export function arrangeStudyObjects(elements: CanvasElement[], sizes: Map<number, Size>, width: number, height: number, left: number): CanvasElement[] {
  const gap = 32;
  const available = Math.max(1, width - left - gap * 2);
  const rows: { items: CanvasElement[]; width: number; height: number }[] = [];
  for (const element of elements) {
    const size = sizes.get(element.boxId);
    if (!size) continue;
    let row = rows[rows.length - 1];
    if (!row || row.items.length === 3 || row.width + gap + size.width > available) {
      row = { items: [], width: 0, height: 0 };
      rows.push(row);
    }
    row.width += (row.items.length ? gap : 0) + size.width;
    row.height = Math.max(row.height, size.height);
    row.items.push(element);
  }
  const totalHeight = rows.reduce((sum, row) => sum + row.height, 0) + Math.max(0, rows.length - 1) * gap;
  let y = Math.max(gap, (height - totalHeight) / 2);
  const positions = new Map<number, {x: number; y: number}>();
  for (const row of rows) {
    let x = left + Math.max(gap, (width - left - row.width) / 2);
    for (const element of row.items) {
      const size = sizes.get(element.boxId)!;
      positions.set(element.boxId, {x: x + size.width / 2, y: y + row.height / 2});
      x += size.width + gap;
    }
    y += row.height + gap;
  }
  return elements.map(element => positions.has(element.boxId) ? {...element, ...positions.get(element.boxId)!} : element);
}

/** Measure with the same renderer and padding used by CanvasBox before restoring. */
export function centerStudyObjects(elements: CanvasElement[], svg: SVGSVGElement, options: Parameters<typeof createBoxRenderer>[1]): CanvasElement[] {
  const bounds = svg.viewBox.baseVal;
  if (!bounds.width || !bounds.height) return elements;
  const stack = svg.querySelector<SVGGElement>('[data-tour="call-stack"]')?.getBBox();
  const left = stack ? stack.x + stack.width : 225;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("visibility", "hidden");
  svg.appendChild(group);
  const sizes = new Map<number, Size>();
  try {
    for (const element of elements) {
      if (element.kind.name === "function") continue;
      const box = createBoxRenderer(element, options);
      group.appendChild(box);
      const size = box.getBBox();
      sizes.set(element.boxId, {width: size.width + 24, height: size.height + 24});
      box.remove();
    }
  } finally { group.remove(); }
  return arrangeStudyObjects(elements, sizes, bounds.width, bounds.height, left);
}
