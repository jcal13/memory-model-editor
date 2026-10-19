import { assignmentRepair } from "./tutorialRepair";
import { CanvasElement } from "../shared/types";

/** Targets belong to the lesson, never to the last arbitrary click. */
export function lessonTarget(step: number, elements: CanvasElement[]): Element | null {
  const palette = () => document.querySelector('[aria-label="Draggable int box"]');
  if (step === 0 || step === 7) return null;
  if (step === 6) return document.querySelector('[data-tour="submit"]');
  const main = elements.find(e => e.kind.name === "function" && e.kind.functionName === "__main__");
  const integers = elements.filter(e => !e.invalidated && e.kind.name === "primitive" && e.kind.type === "int");
  if (step === 1) {
    const existing = integers[0];
    return existing ? document.querySelector(`[data-canvas-box-id="${existing.boxId}"]`) : palette();
  }
  const repair = assignmentRepair(step, elements);
  const wantsReference = step === 3 || repair.reference;
  const intended = step === 3 ? main : repair.target;
  if (!intended) return palette();
  const editor = document.querySelector(`[data-tour="box-editor"][data-box-id="${intended.boxId}"]`);
  if (editor) {
    if (wantsReference) return document.querySelector('[data-tour="reference-picker"]') || editor;
    return editor;
  }
  return document.querySelector(`[data-canvas-box-id="${intended.boxId}"]`);
}

/** Canvas wrappers contain an invisible drag hit area; measure the visible drawing. */
export function targetBounds(target: Element): DOMRect {
  if (target.hasAttribute("data-canvas-box-id")) {
    const drawing = target.querySelector('svg');
    const shapes = drawing ? Array.from(drawing.querySelectorAll('path, rect, text, line, polygon, polyline, circle, ellipse'))
      .filter(e => !e.closest('defs') && e.getAttribute('data-overlay') !== 'true' && e.getAttribute('fill') !== 'transparent' && e.getAttribute('opacity') !== '0' && e.getAttribute('data-tour-ignore') !== 'true') : [];
    const rects = shapes.map(e => e.getBoundingClientRect()).filter(r => r.width > 0 || r.height > 0);
    if (rects.length) {
      const left = Math.min(...rects.map(r => r.left)), top = Math.min(...rects.map(r => r.top));
      return new DOMRect(left, top, Math.max(...rects.map(r => r.right)) - left, Math.max(...rects.map(r => r.bottom)) - top);
    }
  }
  return target.getBoundingClientRect();
}

export function placeCard(target: DOMRect | undefined, width: number, height: number, vw: number, vh: number, obstacles: DOMRect[]) {
  const clamp = (x: number, y: number) => ({left: Math.max(12, Math.min(x, vw-width-12)), top: Math.max(12, Math.min(y, vh-height-64))});
  if (!target) return clamp((vw-width)/2, (vh-height)/2);
  const r = target;
  const slide = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
  const ys = [r.top, r.bottom-height, (r.top+r.bottom-height)/2,
    ...obstacles.flatMap(o => [o.top-height-18, o.bottom+18])]
    .map(y => slide(y, r.top-height+Math.min(40,height,r.height), r.bottom-Math.min(40,height,r.height)));
  const xs = [r.left, r.right-width, (r.left+r.right-width)/2,
    ...obstacles.flatMap(o => [o.left-width-18, o.right+18])]
    .map(x => slide(x, r.left-width+Math.min(40,width,r.width), r.right-Math.min(40,width,r.width)));
  const candidates = [
    ...ys.flatMap(y => [clamp(r.right+18,y), clamp(r.left-width-18,y)]),
    ...xs.flatMap(x => [clamp(x,r.bottom+18), clamp(x,r.top-height-18)]),
  ];
  const overlap = (p: {left:number;top:number}, o: DOMRect) => Math.max(0,Math.min(p.left+width,o.right+8)-Math.max(p.left,o.left-8))*Math.max(0,Math.min(p.top+height,o.bottom+8)-Math.max(p.top,o.top-8));
  const score = (p: {left:number;top:number}) => obstacles.reduce((n,o)=>n+overlap(p,o),0)
    + Math.hypot(p.left+width/2-(r.left+r.right)/2, p.top+height/2-(r.top+r.bottom)/2)*20;
  return candidates.reduce((best,p) => {
    const targetOverlap = overlap(p,r), bestOverlap = overlap(best,r);
    if (targetOverlap !== bestOverlap) return targetOverlap < bestOverlap ? p : best;
    return score(p)<score(best) ? p : best;
  });
}
