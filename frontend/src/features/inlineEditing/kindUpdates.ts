/**
 * Pure helpers that apply a single inline edit to a box's `kind`.
 * Each returns the new kind, or an error string when the input is rejected.
 */

import { BoxType, FunctionParams, ID, PrimitiveKind, PrimitiveType } from "../shared/types";
import { FieldRef } from "./fields";
import { normalizeClassVariable } from "../canvas/utils/canvasReferences";

export type EditResult = { kind: BoxType } | { error: string };

export const PRIMITIVE_TYPES: PrimitiveType[] = [
  "int",
  "float",
  "str",
  "bool",
  "NoneType",
];

/** Accepts "3", "id3", " 3 " → 3; "", "_", "id_" → "_"; anything else → null. */
export function parseIdInput(raw: string): ID | null {
  const s = raw.trim().replace(/^id\s*/i, "");
  if (s === "" || s === "_") return "_";
  if (/^\d+$/.test(s)) return Number(s);
  return null;
}

const DEFAULT_VALUES: Record<PrimitiveType, string> = {
  int: "0",
  float: "0.0",
  str: "",
  bool: "false",
  NoneType: "None",
};

export function convertPrimitiveValue(
  value: string,
  to: PrimitiveType
): string {
  const v = (value ?? "").trim();
  switch (to) {
    case "int":
      return /^-?\d+$/.test(v)
        ? v
        : /^-?\d+\.\d*$/.test(v)
        ? String(Math.trunc(Number(v)))
        : DEFAULT_VALUES.int;
    case "float":
      if (/^-?\d+$/.test(v)) return `${v}.0`;
      return v !== "" && !isNaN(Number(v)) ? v : DEFAULT_VALUES.float;
    case "bool":
      return v === "true" ? "true" : "false";
    case "str":
      return v === "None" ? "" : value ?? "";
    case "NoneType":
      return "None";
  }
}

export function validatePrimitiveValue(
  type: PrimitiveType,
  raw: string
): { value: string } | { error: string } {
  const v = raw.trim();
  switch (type) {
    case "int":
      return /^-?\d+$/.test(v)
        ? { value: v.replace(/^(-?)0+(?=\d)/, "$1") }
        : { error: "An int must be a whole number, e.g. 42" };
    case "float":
      if (/^-?\d+$/.test(v)) return { value: `${v}.0` };
      return v !== "" && !isNaN(Number(v)) && !/[a-z]/i.test(v)
        ? { value: v }
        : { error: "A float must be a number, e.g. 3.14" };
    case "str": {
      // Students often type the quotes MemoryViz shows; don't store them twice.
      const m = raw.match(/^(["'])(.*)\1$/s);
      return { value: m ? m[2] : raw };
    }
    case "bool": {
      const b = v.toLowerCase();
      if (b === "true" || b === "false") return { value: b };
      return { error: "A bool is True or False" };
    }
    case "NoneType":
      return { value: "None" };
  }
}

type NamedRowKind = Extract<BoxType, { name: "class" } | { name: "function" }>;

const rowsOf = (kind: NamedRowKind): FunctionParams[] =>
  kind.name === "function" ? kind.params ?? [] : (kind.classVariables ?? []).map(normalizeClassVariable);

const withRows = (kind: NamedRowKind, rows: FunctionParams[]): BoxType =>
  kind.name === "function"
    ? { ...kind, params: rows }
    : { ...kind, classVariables: rows };

const dictEntries = (kind: Extract<BoxType, { name: "dict" }>) =>
  Object.entries(kind.value ?? {}) as [string, number | "_" | null][];

/** A fresh whitespace placeholder key, mirroring the classic editor's "Add Pair". */
function blankDictKey(entries: [string, unknown][]): string {
  let n = 1;
  const keys = new Set(entries.map(([k]) => k));
  while (keys.has(" ".repeat(n))) n += 1;
  return " ".repeat(n);
}

const isBlankKey = (k: string) => k.trim() === "";

/** Apply a committed text value for `field`. */
export function applyFieldText(
  kind: BoxType,
  field: FieldRef,
  raw: string
): EditResult {
  switch (field.type) {
    case "value": {
      if (kind.name !== "primitive") break;
      const r = validatePrimitiveValue(kind.type, raw);
      return "error" in r ? r : { kind: { ...kind, value: r.value } };
    }
    case "typeLabel": {
      if (kind.name === "primitive") {
        const t = raw as PrimitiveType;
        if (!PRIMITIVE_TYPES.includes(t)) return { error: "Unknown type" };
        return {
          kind: { ...kind, type: t, value: convertPrimitiveValue(kind.value, t) },
        };
      }
      const name = raw.trim();
      // Frames may be qualified methods, e.g. LinkedList.move_to_back.
      const ok = kind.name === "function"
        ? /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(name)
        : /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
      if (!ok)
        return { error: kind.name === "function" ? "Use a Python name, e.g. f or LinkedList.move_to_back" : "Use a valid Python name" };
      if (kind.name === "function") return { kind: { ...kind, functionName: name } };
      if (kind.name === "class") return { kind: { ...kind, className: name } };
      break;
    }
    case "attrName": {
      if (kind.name !== "function" && kind.name !== "class") break;
      const name = raw.trim();
      if (name !== "" && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
        return { error: "Use a valid Python name" };
      const rows = rowsOf(kind);
      if (name !== "" && rows.some((r, i) => i !== field.index && r.name === name))
        return { error: `"${name}" is already used here` };
      return {
        kind: withRows(
          kind,
          rows.map((r, i) => (i === field.index ? { ...r, name } : r))
        ),
      };
    }
    case "item":
    case "attrRef":
    case "dictKey":
    case "dictValue": {
      const id = parseIdInput(raw);
      if (id === null) return { error: "Type an id number, e.g. 3" };
      return applyRef(kind, field, id);
    }
  }
  return { error: "This part can't be edited" };
}

/** Point a reference slot at `id` ("_" clears it). */
export function applyRef(kind: BoxType, field: FieldRef, id: ID): EditResult {
  if (field.type === "item" && (kind.name === "list" || kind.name === "tuple" || kind.name === "set")) {
    const value = [...kind.value] as ID[];
    if (kind.name === "set" && id !== "_" && value.some((v, i) => v === id && i !== field.index))
      return { error: `A set can't hold id${id} twice` };
    value[field.index] = id;
    return { kind: { ...kind, value: value as number[] } };
  }
  if (field.type === "attrRef" && (kind.name === "function" || kind.name === "class")) {
    const rows = rowsOf(kind).map((r, i) =>
      i === field.index ? { ...r, targetId: id as number | null } : r
    );
    return { kind: withRows(kind, rows) };
  }
  if (kind.name === "dict" && (field.type === "dictKey" || field.type === "dictValue")) {
    const entries = dictEntries(kind);
    if (field.type === "dictValue") {
      entries[field.index] = [entries[field.index][0], id];
    } else {
      const newKey = id === "_" ? blankDictKey(entries) : String(id);
      if (id !== "_" && entries.some(([k], i) => k === newKey && i !== field.index))
        return { error: `id${id} is already a key in this dict` };
      entries[field.index] = [newKey, entries[field.index][1]];
    }
    return { kind: { ...kind, value: Object.fromEntries(entries) as any } };
  }
  return { error: "This part can't hold a reference" };
}

/** Append an empty slot; returns the new kind and the field to edit next. */
export function addSlot(kind: BoxType): { kind: BoxType; next: FieldRef } | null {
  switch (kind.name) {
    case "list":
    case "tuple":
    case "set": {
      const value = [...kind.value, "_"] as unknown as number[];
      return { kind: { ...kind, value }, next: { type: "item", index: value.length - 1 } };
    }
    case "function":
    case "class": {
      const rows = [...rowsOf(kind), { name: "", targetId: "_" as unknown as number }];
      return { kind: withRows(kind, rows), next: { type: "attrName", index: rows.length - 1 } };
    }
    case "dict": {
      const entries = dictEntries(kind);
      const next = [...entries, [blankDictKey(entries), "_"] as [string, "_"]];
      // Blank keys sort after numeric ones, so the new pair is always last.
      return {
        kind: { ...kind, value: Object.fromEntries(next) as any },
        next: { type: "dictKey", index: next.length - 1 },
      };
    }
  }
  return null;
}

export function removeSlot(kind: BoxType, field: FieldRef): BoxType | null {
  const index = (field as { index?: number }).index;
  if (index === undefined) return null;
  switch (kind.name) {
    case "list":
    case "tuple":
    case "set":
      if (field.type !== "item") return null;
      return { ...kind, value: kind.value.filter((_, i) => i !== index) };
    case "function":
    case "class":
      if (field.type !== "attrName" && field.type !== "attrRef") return null;
      return withRows(kind, rowsOf(kind).filter((_, i) => i !== index));
    case "dict":
      if (field.type !== "dictKey" && field.type !== "dictValue") return null;
      return {
        ...kind,
        value: Object.fromEntries(dictEntries(kind).filter((_, i) => i !== index)) as any,
      };
  }
  return null;
}

/** Text to prefill the inline input with. */
export function initialText(kind: BoxType, field: FieldRef, id: ID): string {
  const refText = (v: unknown) =>
    typeof v === "number" ? String(v) : typeof v === "string" && /^\d+$/.test(v) ? v : "";
  switch (field.type) {
    case "boxId":
      return refText(id);
    case "value":
      return kind.name === "primitive" ? kind.value ?? "" : "";
    case "typeLabel":
      return kind.name === "function"
        ? kind.functionName
        : kind.name === "class"
        ? kind.className
        : kind.type;
    case "attrName":
      return kind.name === "function" || kind.name === "class"
        ? rowsOf(kind)[field.index]?.name ?? ""
        : "";
    case "attrRef":
      return kind.name === "function" || kind.name === "class"
        ? refText(rowsOf(kind)[field.index]?.targetId)
        : "";
    case "item":
      return Array.isArray(kind.value) ? refText(kind.value[field.index]) : "";
    case "dictKey":
    case "dictValue": {
      if (kind.name !== "dict") return "";
      const [k, v] = dictEntries(kind)[field.index] ?? ["", "_"];
      return field.type === "dictKey" ? (isBlankKey(k) ? "" : k) : refText(v);
    }
  }
}

/** Which slot a removable field belongs to (used for the × badge). */
export const isRemovableField = (kind: BoxType, field: FieldRef) =>
  (field.type === "item" && ["list", "tuple", "set"].includes(kind.name)) ||
  ((field.type === "attrRef" || field.type === "attrName") &&
    (kind.name === "function" || kind.name === "class")) ||
  ((field.type === "dictKey" || field.type === "dictValue") && kind.name === "dict");

/**
 * Python Tutor "values inline" slots accept a literal: 5, -2.5, "hi", 'hi',
 * True, False, None. Returns null for anything else (e.g. "id3").
 */
export function parsePythonLiteral(raw: string): PrimitiveKind | null {
  const s = raw.trim();
  if (s === "None") return { name: "primitive", type: "NoneType", value: "None" };
  if (/^(true|false)$/i.test(s))
    return { name: "primitive", type: "bool", value: s.toLowerCase() };
  if (/^-?\d+$/.test(s))
    return { name: "primitive", type: "int", value: s.replace(/^(-?)0+(?=\d)/, "$1") };
  if (/^-?(\d+\.\d*|\.\d+)(e-?\d+)?$/i.test(s))
    return { name: "primitive", type: "float", value: s };
  const m = s.match(/^(["'])(.*)\1$/s);
  if (m) return { name: "primitive", type: "str", value: m[2] };
  return null;
}

/** The id currently held by a reference slot ("_" / null when empty). */
export function getSlotTarget(kind: BoxType, field: FieldRef): ID | string | null {
  const index = (field as { index?: number }).index ?? -1;
  switch (field.type) {
    case "item":
      return Array.isArray(kind.value) ? (kind.value[index] as ID) ?? null : null;
    case "attrRef":
      if (kind.name === "function") return (kind.params[index]?.targetId as ID) ?? null;
      if (kind.name === "class") return (rowsOf(kind)[index]?.targetId as ID) ?? null;
      return null;
    case "dictKey":
    case "dictValue": {
      if (kind.name !== "dict") return null;
      const entry = Object.entries(kind.value ?? {})[index];
      if (!entry) return null;
      return field.type === "dictKey" ? (entry[0].trim() === "" ? "_" : entry[0]) : (entry[1] as ID);
    }
    default:
      return null;
  }
}
