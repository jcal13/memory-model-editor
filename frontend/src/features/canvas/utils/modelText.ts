/**
 * Plain-text descriptions of the memory model for screen readers:
 *  - `buildModelOutline` — the "Text view": call stack and objects as lines.
 *  - `describeChanges`   — short announcements for an edit ("a now refers to id1").
 *
 * Python Tutor's "values inline" mode hides primitive boxes and draws their
 * value inside the slot, so there a reference to one reads as its value (5,
 * "hi") instead of an id, and the hidden boxes are not listed.
 */

import { BoxType, CanvasElement } from "../../shared/types";
import { formatPrimitiveValue, normalizeClassVariable } from "./canvasReferences";

export type TextOptions = { inlinePrimitives?: boolean };

const isEmptyRef = (t: unknown) => t === "_" || t === null || t === undefined || t === "";

const asId = (t: unknown): number | null =>
  typeof t === "number" ? t : typeof t === "string" && /^\d+$/.test(t) ? Number(t) : null;

const isHidden = (el: CanvasElement, opts: TextOptions) =>
  !!opts.inlinePrimitives && el.kind.name === "primitive";

/** How a reference reads: "id3", "empty", or (inline values) `5` / `"hi"`. */
export function makeRefText(elements: CanvasElement[], opts: TextOptions = {}) {
  return (target: unknown): string => {
    if (isEmptyRef(target)) return "empty";
    const id = asId(target);
    if (id === null) return String(target);
    if (opts.inlinePrimitives) {
      const t = elements.find((e) => e.id === id && e.kind.name === "primitive");
      if (t && t.kind.name === "primitive") return formatPrimitiveValue(t.kind);
    }
    return `id${id}`;
  };
}

/** "list id3", "int id2", "Point id4", "frame f". */
export function boxName(el: CanvasElement): string {
  const k = el.kind;
  if (k.name === "function") return `frame ${k.functionName}`;
  const type = k.name === "class" ? k.className : k.name === "primitive" ? (k.type === "NoneType" ? "None" : k.type) : k.name;
  return isEmptyRef(el.id) ? `${type} with no id` : `${type} id${el.id}`;
}

type Row = { name?: string; target: unknown };
type Rows = { noun: "variable" | "attribute" | "element" | "pair"; named: boolean; rows: Row[] };

/** The reference slots of a box, in drawing order. */
function rowsOf(kind: BoxType): Rows | null {
  switch (kind.name) {
    case "function":
      return { noun: "variable", named: true, rows: kind.params.map((p) => ({ name: p.name, target: p.targetId })) };
    case "class":
      return {
        noun: "attribute",
        named: true,
        rows: kind.classVariables.map(normalizeClassVariable).map((v) => ({ name: v.name, target: v.targetId })),
      };
    case "list":
    case "tuple":
    case "set":
      return { noun: "element", named: false, rows: kind.value.map((v) => ({ target: v })) };
    case "dict":
      return {
        noun: "pair",
        named: false,
        rows: Object.entries(kind.value ?? {}).map(([key, v]) => ({ name: key, target: v })),
      };
    default:
      return null;
  }
}

/** One outline line for an object, e.g. `id2: list [id3, id4]`. */
function objectLine(el: CanvasElement, ref: (t: unknown) => string): string {
  const k = el.kind;
  const head = isEmptyRef(el.id) ? "no id" : `id${el.id}`;
  let body: string;
  switch (k.name) {
    case "primitive":
      body = k.type === "NoneType" ? "None" : `${k.type} ${formatPrimitiveValue(k)}`;
      break;
    case "list":
      body = `list [${k.value.map(ref).join(", ")}]`;
      break;
    case "tuple":
      body = `tuple (${k.value.map(ref).join(", ")})`;
      break;
    case "set":
      body = `set {${k.value.map(ref).join(", ")}}`;
      break;
    case "dict": {
      const pairs = Object.entries(k.value ?? {}).map(([key, v]) => `${ref(key)}: ${ref(v)}`);
      body = `dict {${pairs.join(", ")}}`;
      break;
    }
    case "class": {
      const attrs = k.classVariables
        .map(normalizeClassVariable)
        .map((v) => `${v.name || "unnamed"} → ${ref(v.targetId)}`);
      body = `${k.className} object${attrs.length ? `: ${attrs.join(", ")}` : ", no attributes"}`;
      break;
    }
    default:
      body = "box";
  }
  return `${head}: ${body}${el.invalidated ? " (crossed out)" : ""}`;
}

function frameLine(el: CanvasElement, ref: (t: unknown) => string): string {
  const k = el.kind;
  if (k.name !== "function") return "";
  const vars = k.params.map((p) => `${p.name || "unnamed"} → ${ref(p.targetId)}`);
  return `${k.functionName}: ${vars.length ? vars.join(", ") : "no variables"}${el.invalidated ? " (crossed out)" : ""}`;
}

export type OutlineLine = { boxId: number; text: string };
export type ModelOutline = { summary: string; frames: OutlineLine[]; objects: OutlineLine[] };

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/**
 * The text view of the model: frames in call-stack order (as stored), then
 * objects by id (boxes with no id last).
 */
export function buildModelOutline(elements: CanvasElement[], opts: TextOptions = {}): ModelOutline {
  const ref = makeRefText(elements, opts);
  const frames = elements
    .filter((e) => e.kind.name === "function")
    .map((e) => ({ boxId: e.boxId, text: frameLine(e, ref) }));
  const objects = elements
    .filter((e) => e.kind.name !== "function" && !isHidden(e, opts))
    .sort((a, b) => (asId(a.id) ?? Infinity) - (asId(b.id) ?? Infinity) || a.boxId - b.boxId)
    .map((e) => ({ boxId: e.boxId, text: objectLine(e, ref) }));
  const summary =
    frames.length + objects.length === 0
      ? "The canvas is empty."
      : `${plural(frames.length, "frame")}, ${plural(objects.length, "object")}.`;
  return { summary, frames, objects };
}

// ------------------------------------------------------------ announcements

/** Above this many changes at once (e.g. loading a question), summarise. */
export const MAX_CHANGE_MESSAGES = 4;

const sameJSON = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Where a frame row lives, for messages: nothing for `__main__`. */
const inBox = (el: CanvasElement) =>
  el.kind.name === "function" && el.kind.functionName === "__main__" ? "" : ` in ${boxName(el)}`;

function rowLabel(el: CanvasElement, rows: Rows, i: number, row: Row): string {
  if (el.kind.name === "function" || el.kind.name === "class") {
    return `${row.name || `${rows.noun} ${i + 1}`}${inBox(el)}`;
  }
  return `${rows.noun === "pair" ? "value" : "element"} ${i + 1} of ${boxName(el)}`;
}

function pointsAt(label: string, target: unknown, ref: (t: unknown) => string): string {
  if (isEmptyRef(target)) return `${label} is now empty`;
  const text = ref(target);
  return /^id\d+$/.test(text) ? `${label} now refers to ${text}` : `${label} is now ${text}`;
}

function changesInBox(
  before: CanvasElement,
  after: CanvasElement,
  ref: (t: unknown) => string
): string[] {
  const out: string[] = [];
  const a = before.kind;
  const b = after.kind;
  if (before.id !== after.id && b.name !== "function") {
    out.push(isEmptyRef(after.id) ? `${boxName(before)} now has no id` : `${boxName(before)} now has id${after.id}`);
  }
  if (a.name === "function" && b.name === "function" && a.functionName !== b.functionName) {
    out.push(`Frame ${a.functionName} renamed to ${b.functionName}`);
  }
  if (a.name === "class" && b.name === "class" && a.className !== b.className) {
    out.push(`${boxName(after)} is now a ${b.className} object`);
  }
  if (a.name === "primitive" && b.name === "primitive") {
    if (a.type !== b.type) out.push(`${boxName(before)} is now a ${b.type === "NoneType" ? "None" : b.type}, ${formatPrimitiveValue(b)}`);
    else if (a.value !== b.value) out.push(`${boxName(after)} is now ${formatPrimitiveValue(b)}`);
  } else if (a.name !== b.name) {
    out.push(`${boxName(after)} changed`);
  }

  const ra = rowsOf(a);
  const rb = rowsOf(b);
  if (ra && rb && a.name === b.name) {
    const where = b.name === "function" && b.functionName === "__main__" ? "__main__" : boxName(after);
    if (rb.rows.length === ra.rows.length + 1 && sameJSON(ra.rows, rb.rows.slice(0, ra.rows.length))) {
      out.push(`Added ${rb.noun} ${rb.rows.length} to ${where}`);
    } else if (rb.rows.length === ra.rows.length - 1) {
      let i = 0;
      while (i < rb.rows.length && sameJSON(ra.rows[i], rb.rows[i])) i++;
      const gone = ra.rows[i];
      const named = ra.named && gone?.name ? ` (${gone.name})` : "";
      out.push(`Removed ${ra.noun} ${i + 1}${named} from ${where}`);
    } else if (rb.rows.length === ra.rows.length) {
      rb.rows.forEach((row, i) => {
        const old = ra.rows[i];
        if (rb.noun === "pair" && old.name !== row.name) {
          out.push(`Key ${i + 1} of ${boxName(after)} is now ${ref(row.name)}`);
        } else if (rb.named && old.name !== row.name) {
          out.push(`${rb.noun[0].toUpperCase()}${rb.noun.slice(1)} ${i + 1}${inBox(after)} is now named ${row.name || "nothing"}`);
        }
        if (!sameJSON(old.target, row.target)) out.push(pointsAt(rowLabel(after, rb, i, row), row.target, ref));
      });
    } else if (!sameJSON(ra.rows, rb.rows)) {
      out.push(`${boxName(after)} changed`);
    }
  }

  if (!!before.invalidated !== !!after.invalidated) {
    out.push(after.invalidated ? `Crossed out ${boxName(after)}` : `${boxName(after)} is no longer crossed out`);
  }
  return out;
}

/**
 * Short spoken descriptions of what changed between two canvas states.
 * Positions and validation errors are ignored. More than
 * MAX_CHANGE_MESSAGES changes collapse into one summary line.
 */
export function describeChanges(
  prev: CanvasElement[],
  next: CanvasElement[],
  opts: TextOptions = {}
): string[] {
  if (prev === next) return [];
  const ref = makeRefText(next, opts);
  const before = new Map(prev.map((e) => [e.boxId, e]));
  const after = new Map(next.map((e) => [e.boxId, e]));
  const out: string[] = [];

  next.forEach((el) => {
    const old = before.get(el.boxId);
    if (!old) {
      if (!isHidden(el, opts)) out.push(`Added ${boxName(el)}`);
      return;
    }
    if (old === el || (old.id === el.id && old.kind === el.kind && !!old.invalidated === !!el.invalidated)) return;
    if (sameJSON(old.kind, el.kind) && old.id === el.id && !!old.invalidated === !!el.invalidated) return;
    if (isHidden(el, opts)) {
      // A value typed into a slot updated its hidden primitive in place.
      if (el.kind.name === "primitive" && !sameJSON(old.kind, el.kind)) {
        const id = asId(el.id);
        next.forEach((owner) => {
          const rows = rowsOf(owner.kind);
          rows?.rows.forEach((row, i) => {
            if (id !== null && asId(row.target) === id) out.push(pointsAt(rowLabel(owner, rows, i, row), row.target, ref));
          });
        });
      }
      return;
    }
    out.push(...changesInBox(old, el, ref));
  });
  prev.forEach((el) => {
    if (!after.has(el.boxId) && !isHidden(el, opts)) out.push(`Deleted ${boxName(el)}`);
  });

  if (out.length > MAX_CHANGE_MESSAGES) {
    const added = out.filter((m) => m.startsWith("Added ")).length;
    return [
      added === out.length
        ? `Canvas updated: ${plural(added, "box")} added`.replace("boxs", "boxes")
        : `Canvas updated: ${out.length} changes`,
    ];
  }
  return out;
}

/** Spoken summary of a Submit result for the live region. */
export function describeSubmission(result: { correct: boolean; errors: { message: string }[] }): string {
  if (result.correct) return "Submitted. Correct: your memory model matches the expected answer.";
  const n = result.errors.length;
  if (n === 0) return "Submitted. Not correct yet.";
  return `Submitted. ${n === 1 ? "1 issue" : `${n} issues`} found. First: ${result.errors[0].message}`;
}
