import { BoxType, CanvasElement } from "../shared/types";
import { FieldGeom, FieldRef } from "./fields";
import { normalizeClassVariable } from "../canvas/utils/canvasReferences";

/** Pure helpers for the inline editor: field order, labels and lookups. */

const fieldOrder: Record<FieldRef["type"], number> = {
  boxId: -2,
  typeLabel: -1,
  value: 0,
  item: 0,
  attrName: 0,
  dictKey: 0,
  attrRef: 1,
  dictValue: 1,
};

export const tabOrder = (fields: FieldGeom[]) =>
  fields
    .filter((f) => f.ref.type !== "boxId" && f.ref.type !== "typeLabel")
    .sort((a, b) => {
      const ia = (a.ref as { index?: number }).index ?? 0;
      const ib = (b.ref as { index?: number }).index ?? 0;
      return ia - ib || fieldOrder[a.ref.type] - fieldOrder[b.ref.type];
    });

export const supportsSlots = (kind: BoxType) =>
  ["list", "tuple", "set", "dict", "class", "function"].includes(kind.name);

export const describeTarget = (el: CanvasElement): string => {
  const k = el.kind;
  if (k.name === "primitive") {
    if (k.type === "NoneType") return "None";
    if (k.type === "str") return `"${k.value}"`;
    return k.value;
  }
  if (k.name === "class") return k.className;
  return k.name;
};

/** How many reference slots across the canvas point at `target`. */
export function countReferences(elements: CanvasElement[], target: unknown): number {
  const id = typeof target === "number" ? target : typeof target === "string" && /^\d+$/.test(target) ? Number(target) : null;
  if (id === null) return 0;
  const is = (v: unknown) => v === id || v === String(id);
  let n = 0;
  elements.forEach((e) => {
    const k = e.kind;
    if (k.name === "function") k.params.forEach((p) => is(p.targetId) && n++);
    else if (k.name === "class") k.classVariables.map(normalizeClassVariable).forEach((v) => is(v.targetId) && n++);
    else if (k.name === "list" || k.name === "tuple" || k.name === "set") k.value.forEach((v) => is(v) && n++);
    else if (k.name === "dict")
      Object.entries(k.value ?? {}).forEach(([key, v]) => {
        if (is(key)) n++;
        if (is(v)) n++;
      });
  });
  return n;
}

export function addLabel(kind: BoxType): string {
  switch (kind.name) {
    case "function":
      return "variable";
    case "class":
      return "attribute";
    case "dict":
      return "pair";
    default:
      return "element";
  }
}

/** Screen-reader label for an inline input, e.g. "Variable 2 name in __main__". */
export function describeField(el: CanvasElement, ref: FieldRef): string {
  const k = el.kind;
  const box =
    k.name === "function"
      ? `frame ${k.functionName}`
      : `${k.name === "class" ? k.className : k.name === "primitive" ? k.type : k.name} object${
          typeof el.id === "number" ? ` id${el.id}` : " with no id"
        }`;
  const n = (ref as { index?: number }).index;
  const row = n === undefined ? "" : ` ${n + 1}`;
  switch (ref.type) {
    case "boxId": return `Id of ${box}`;
    case "typeLabel": return k.name === "function" ? `Name of ${box}` : `Type of ${box}`;
    case "value": return `Value of ${box}`;
    case "item": return `Element${row} of ${box}, an id`;
    case "attrName": return `${k.name === "function" ? "Variable" : "Attribute"}${row} name in ${box}`;
    case "attrRef": return `${k.name === "function" ? "Variable" : "Attribute"}${row} id in ${box}`;
    case "dictKey": return `Key${row} of ${box}, an id`;
    case "dictValue": return `Value${row} of ${box}, an id`;
  }
}
