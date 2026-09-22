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
  const value = step === 4 ? 4 : step === 5 ? 6 : 5;
  const valued = integers.find(e => e.kind.name === "primitive" && Number(e.kind.value) === value);
  const usedIds = new Set(main?.kind.name === "function" ? main.kind.params.map(p => p.targetId) : []);
  const object = valued || integers.find(e => !usedIds.has(e.id as number));
  const wantsReference = step === 3 || ((step === 4 || step === 5) && !!valued);
  const intended = wantsReference ? main : object;
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
  const candidates = [clamp(r.right+18,r.top),clamp(r.left-width-18,r.top),clamp(r.left,r.bottom+18),clamp(r.left,r.top-height-18),...obstacles.flatMap(o => [clamp(o.right+18,r.top), clamp(r.right+18,o.bottom+18), clamp(r.left,o.bottom+18)]),clamp(12,12),clamp(vw-width-12,12)];
  const overlap = (p: {left:number;top:number}, o: DOMRect) => Math.max(0,Math.min(p.left+width,o.right+8)-Math.max(p.left,o.left-8))*Math.max(0,Math.min(p.top+height,o.bottom+8)-Math.max(p.top,o.top-8));
  return candidates.reduce((best,p) => {
    const score = (v: typeof p) => overlap(v,r)*100 + obstacles.reduce((n,o)=>n+overlap(v,o),0) + Math.hypot(v.left-r.right, v.top-r.top)*0.01;
    return score(p)<score(best) ? p : best;
  });
}
