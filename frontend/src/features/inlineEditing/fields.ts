/**
 * Locates the editable parts of a rendered MemoryViz box.
 *
 * MemoryViz emits one classed <text> per visible token, in data order:
 *   primitive   value                           | id type
 *   list/tuple  (ref, index)*                   | id type
 *   set         ref*                            | id type
 *   dict        (key, ":", value)*              | id type
 *   class       (attribute, ref)*               | id type
 *   function    (variable, ref)*                | name
 * so the editable fields can be recovered from the DOM without changing the
 * renderer. Rects are returned in client (viewport) coordinates.
 */

import { CanvasElement } from "../shared/types";
import { normalizeClassVariable } from "../canvas/utils/canvasReferences";

export type FieldRef =
  | { type: "boxId" }
  | { type: "typeLabel" }
  | { type: "value" }
  | { type: "item"; index: number }
  | { type: "attrName"; index: number }
  | { type: "attrRef"; index: number }
  | { type: "dictKey"; index: number }
  | { type: "dictValue"; index: number };

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FieldGeom {
  ref: FieldRef;
  rect: Rect;
  text: string;
}

export interface BoxGeom {
  boxId: number;
  rect: Rect;
  /** Client px per MemoryViz unit (canvas zoom x page zoom). */
  unit: number;
  fields: FieldGeom[];
}

export const isRefField = (ref: FieldRef) =>
  ref.type === "item" ||
  ref.type === "attrRef" ||
  ref.type === "dictKey" ||
  ref.type === "dictValue";

export const sameField = (a: FieldRef | null, b: FieldRef | null) =>
  !!a &&
  !!b &&
  a.type === b.type &&
  (a as { index?: number }).index === (b as { index?: number }).index;

export function findBoxGroup(
  root: ParentNode,
  boxId: number
): SVGGElement | null {
  return root.querySelector<SVGGElement>(
    `g[data-canvas-box-id="${boxId}"][data-canvas-render-mode="canvas"]`
  );
}

function cellAround(
  text: SVGTextElement,
  unit: number,
  minWidth: number,
  height: number,
  padX: number
): Rect {
  const r = text.getBoundingClientRect();
  let cx = r.left + r.width / 2;
  // Empty text has no width; MemoryViz attribute names are start-anchored.
  if (r.width < 1 && text.getAttribute("text-anchor") !== "middle") {
    cx = r.left + (minWidth * unit) / 2;
  }
  const cy = r.height > 0 ? r.top + r.height / 2 : r.top;
  const width = Math.max(r.width + padX * 2 * unit, minWidth * unit);
  const h = height * unit;
  return { left: cx - width / 2, top: cy - h / 2, width, height: h };
}

/**
 * The box as drawn: the union of its visible shapes. The SVG's own viewBox
 * isn't a reliable guide because renderers don't always draw from (0, 0),
 * so trimming a fixed padding left the outline offset from the box.
 */
export function drawnRect(boxSvg: SVGSVGElement, unit: number): Rect {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  boxSvg
    .querySelectorAll<SVGGraphicsElement>("rect, path, line, polygon, polyline, ellipse, circle")
    .forEach((s) => {
      if (s.hasAttribute("data-overlay") || s.hasAttribute("data-edit-field") || s.closest("defs")) return;
      const box = s.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return;
      l = Math.min(l, box.left);
      t = Math.min(t, box.top);
      r = Math.max(r, box.right);
      b = Math.max(b, box.bottom);
    });
  if (l === Infinity) {
    const outer = boxSvg.getBoundingClientRect();
    const pad = 12 * unit;
    return {
      left: outer.left + pad,
      top: outer.top + pad,
      width: Math.max(0, outer.width - pad * 2),
      height: Math.max(0, outer.height - pad * 2),
    };
  }
  return { left: l, top: t, width: r - l, height: b - t };
}

export function readBoxGeometry(
  element: CanvasElement,
  group: SVGGElement
): BoxGeom | null {
  const boxSvg = group.querySelector("svg");
  if (!boxSvg) return null;
  const ctm = boxSvg.getScreenCTM();
  const unit = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
  const rect = drawnRect(boxSvg, unit);

  // Renderers we own (Python Tutor style) tag editable cells explicitly.
  const markers = Array.from(
    boxSvg.querySelectorAll<SVGRectElement>("rect[data-edit-field]")
  );
  if (markers.length > 0) {
    const fields: FieldGeom[] = markers.map((m) => {
      const r = m.getBoundingClientRect();
      const type = m.getAttribute("data-edit-field") as FieldRef["type"];
      const index = Number(m.getAttribute("data-edit-index"));
      const ref = (
        m.hasAttribute("data-edit-index") ? { type, index } : { type }
      ) as FieldRef;
      return {
        ref,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        text: "",
      };
    });
    return { boxId: element.boxId, rect, unit, fields };
  }

  const texts = Array.from(boxSvg.querySelectorAll<SVGTextElement>("text"));
  const kind = element.kind.name;
  const cls = (t: SVGTextElement) => t.getAttribute("class") ?? "";
  // Header = the "type" text, preceded by the box's own id text (frames have
  // no id). Sets also draw "{" "}" after the header, so don't rely on order.
  const typeIdx = texts.map(cls).lastIndexOf("type");
  const idIdx =
    kind !== "function" && typeIdx > 0 && cls(texts[typeIdx - 1]) === "id"
      ? typeIdx - 1
      : -1;
  const body = texts.filter((_, i) => i !== typeIdx && i !== idIdx);
  const fields: FieldGeom[] = [];
  const push = (
    ref: FieldRef,
    t: SVGTextElement,
    minWidth: number,
    height: number,
    padX = 7
  ) =>
    fields.push({
      ref,
      rect: cellAround(t, unit, minWidth, height, padX),
      text: t.textContent ?? "",
    });

  if (kind === "function") {
    if (typeIdx >= 0) push({ type: "typeLabel" }, texts[typeIdx], 60, 26, 6);
  } else {
    if (idIdx >= 0) push({ type: "boxId" }, texts[idIdx], 34, 26, 5);
    if (typeIdx >= 0) push({ type: "typeLabel" }, texts[typeIdx], 34, 26, 5);
  }

  switch (kind) {
    case "primitive": {
      const valueText = body.find((t) => cls(t) === "value") ?? body[0];
      if (valueText) push({ type: "value" }, valueText, 70, 30, 10);
      break;
    }
    case "list":
    case "tuple":
    case "set": {
      body
        .filter((t) => cls(t) === "id" && (t.textContent ?? "").startsWith("id"))
        .forEach((t, index) => push({ type: "item", index }, t, 46, 32));
      break;
    }
    case "dict": {
      // Keys are drawn first, then values, so pair them up by row (y) and
      // column (x) rather than by document order.
      const rowsByY = new Map<number, SVGTextElement[]>();
      body
        .filter((t) => cls(t) === "id")
        .forEach((t) => {
          const y = Math.round(Number(t.getAttribute("y")) || 0);
          rowsByY.set(y, [...(rowsByY.get(y) ?? []), t]);
        });
      Array.from(rowsByY.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([, row], index) => {
          const [key, value] = row.sort(
            (a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x"))
          );
          if (key) push({ type: "dictKey", index }, key, 46, 32);
          if (value) push({ type: "dictValue", index }, value, 46, 32);
        });
      break;
    }
    case "class":
    case "function": {
      const names = body.filter((t) =>
        ["attribute", "variable"].includes(cls(t))
      );
      const refs = body.filter((t) => cls(t) === "id");
      const rows =
        element.kind.name === "function"
          ? element.kind.params
          : element.kind.name === "class"
          ? element.kind.classVariables.map(normalizeClassVariable)
          : [];
      // MemoryViz draws no text for the first blank name and zero-width-space
      // texts for later blanks (its unique-key trick), so blank-named rows get
      // a synthesized cell on their own row; named rows take the named texts
      // in order.
      const namedTexts = names.filter(
        (t) => (t.textContent ?? "").replace(/\u200B/g, "") !== ""
      );
      let n = 0;
      refs.forEach((refText, index) => {
        const rowName = rows[index]?.name ?? "";
        if (rowName !== "" && namedTexts[n]) {
          push({ type: "attrName", index }, namedTexts[n], 60, 30, 6);
          n += 1;
        } else if (ctm) {
          const r = refText.getBoundingClientRect();
          const left = ctm.a * 25 + ctm.e; // attribute names start at x=25
          const h = 30 * unit;
          fields.push({
            ref: { type: "attrName", index },
            rect: { left: left - 4 * unit, top: r.top + r.height / 2 - h / 2, width: 68 * unit, height: h },
            text: "",
          });
        }
        push({ type: "attrRef", index }, refText, 46, 32);
      });
      break;
    }
  }

  return { boxId: element.boxId, rect, unit, fields };
}

export function fieldAtPoint(
  geom: BoxGeom,
  x: number,
  y: number
): FieldGeom | null {
  // Prefer the smallest rect containing the point (header chips can overlap).
  let best: FieldGeom | null = null;
  for (const f of geom.fields) {
    const { left, top, width, height } = f.rect;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      if (!best || width * height < best.rect.width * best.rect.height) {
        best = f;
      }
    }
  }
  return best;
}
