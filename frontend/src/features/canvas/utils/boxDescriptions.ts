import { CanvasElement } from "../../shared/types";
import { normalizeClassVariable } from "./canvasReferences";

const idText = (id: unknown) =>
  id === "_" || id === null || id === undefined || id === "" ? "no id" : `id${id}`;

const refText = (target: unknown) =>
  target === "_" || target === null || target === undefined || target === "" ? "empty" : `id${target}`;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * A short spoken description of a canvas box, used as its accessible name,
 * e.g. "int object id3, value 5" or "Frame __main__: a → id1, b → id2".
 */
export function describeBox(el: CanvasElement): string {
  const k = el.kind;
  let text: string;
  switch (k.name) {
    case "function": {
      const vars = k.params.map((p) => `${p.name || "unnamed"} → ${refText(p.targetId)}`);
      text = `Frame ${k.functionName}${vars.length ? `: ${vars.join(", ")}` : ", no variables"}`;
      break;
    }
    case "primitive":
      text =
        k.type === "NoneType"
          ? `None object ${idText(el.id)}`
          : `${k.type} object ${idText(el.id)}, value ${k.value === "" ? "empty" : k.type === "str" ? `"${k.value}"` : k.value}`;
      break;
    case "list":
    case "tuple":
    case "set": {
      const items = k.value.map(refText);
      text = `${k.name} ${idText(el.id)}, ${items.length ? `${plural(items.length, "item")}: ${items.join(", ")}` : "empty"}`;
      break;
    }
    case "dict": {
      const pairs = Object.entries(k.value ?? {}).map(([key, v]) => `${refText(key)} → ${refText(v)}`);
      text = `dict ${idText(el.id)}, ${pairs.length ? `${plural(pairs.length, "pair")}: ${pairs.join(", ")}` : "empty"}`;
      break;
    }
    case "class": {
      const attrs = k.classVariables.map(normalizeClassVariable).map((v) => `${v.name || "unnamed"} → ${refText(v.targetId)}`);
      text = `${k.className} object ${idText(el.id)}${attrs.length ? `: ${attrs.join(", ")}` : ", no attributes"}`;
      break;
    }
    default:
      text = "box";
  }
  return el.invalidated ? `${text} (crossed out)` : text;
}

export type PlacedBox = { boxId: number; isFrame: boolean; left: number; top: number };

/**
 * Keyboard (Tab) order: call-stack frames top to bottom, then objects in
 * reading order (rows top to bottom, left to right within a row).
 */
export function boxReadingOrder(boxes: PlacedBox[], rowTolerance = 24): number[] {
  const frames = boxes.filter((b) => b.isFrame).sort((a, b) => a.top - b.top);
  const objects = boxes
    .filter((b) => !b.isFrame)
    .sort((a, b) => (Math.abs(a.top - b.top) <= rowTolerance ? a.left - b.left : a.top - b.top));
  return [...frames, ...objects].map((b) => b.boxId);
}
