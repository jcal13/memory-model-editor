import { ID } from "../../shared/types";

/**
 * Shared SVG style used by BoxRenderer for all box types.
 */
const style = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
};

/**
 * Extracts numeric values from an element's `kind.value`.
 * - Handles arrays (list, tuple, set)
 * - Handles objects (dict)
 * - Ignores NaN results
 *
 * @param kind - The kind object containing a `value` field
 * @returns Array of numeric values
 */
const getValues = (kind: any): number[] => {
  if (Array.isArray(kind.value)) {
    // List / tuple / set values
    return kind.value
      .map((v: any) => (v === "_" ? "_" : +v))
      .filter((v: any) => v === "_" || !isNaN(v));
  } else if (kind.value && typeof kind.value === "object") {
    // Dict values
    return Object.values(kind.value)
      .map((v: any) => +v)
      .filter((v) => !isNaN(v));
  }
  return [];
};

const normalizeIdForRender = (v: unknown): number | "_" =>
  typeof v === "number" && Number.isInteger(v) ? v : "_";

const makeUniqueKey = (raw: unknown, used: Set<string>): string => {
  const base = typeof raw === "string" ? raw : "";
  let key = base;
  while (used.has(key)) key += "\u200B"; // visually identical
  used.add(key);
  return key;
};

/* ==========================================================
 * BoxConfigs: Configuration map for every supported box type
 * Each entry includes:
 *  - draw(...)      Render logic for the box
 *  - getHeight(...) Height (or dynamic height) in pixels
 *  - getMinWidth()  Minimum width in pixels
 * ========================================================== */
export const BoxConfigs = {
  /* ---------- Primitive Box ---------- */
  primitive: {
    draw: (model: any, kind: any, id: ID) => {
      const isNone = kind.type === "None" || kind.value === null;
      const type = isNone ? "None" : kind.type;

      let value: any;
      if (isNone) {
        value = "null";
      } else if (["string", "number", "boolean"].includes(typeof kind.value)) {
        value = kind.type === "bool" ? kind.value === "true" : kind.value;
      } else {
        value = "";
      }

      model.drawPrimitive(0, 0, type, id, value, style);
    },
    getHeight: () => 90,
    getMinWidth: () => 170,
  },

  /* ---------- Function Box ---------- */
  function: {
    draw: (model: any, kind: any, id: ID) => {
      const used = new Set<string>();
      const props: Record<string, number | "_"> = {};

      (kind.params || []).forEach((p: any) => {
        const key = makeUniqueKey(p.name, used);
        props[key] = normalizeIdForRender(p.targetId); // "_" visible if unassigned
      });

      model.drawClass(0, 0, kind.functionName ?? "", id, props, true, style);
    },
    getHeight: () => 90,
    getMinWidth: () => 190,
  },

  /* ---------- List Box ---------- */
  list: {
    draw: (model: any, kind: any, id: ID) => {
      const vals = getValues(kind);
      model.drawSequence(0, 0, "list", id, vals, vals.length > 0, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 100),
    getMinWidth: () => 190,
  },

  /* ---------- Tuple Box ---------- */
  tuple: {
    draw: (model: any, kind: any, id: ID) => {
      const vals = getValues(kind);
      model.drawSequence(0, 0, "tuple", id, vals, vals.length > 0, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 100),
    getMinWidth: () => 170,
  },

  /* ---------- Set Box ---------- */
  set: {
    draw: (model: any, kind: any, id: ID) => {
      const vals = getValues(kind);
      model.drawSet(0, 0, id, vals, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 90),
    getMinWidth: () => 203,
  },

  /* ---------- Dict Box ---------- */
  dict: {
    draw: (model: any, kind: any, id: ID) => {
      const dict =
        typeof kind.value === "object" && !Array.isArray(kind.value)
          ? kind.value
          : {};
      model.drawDict(0, 0, id, dict, style);
    },
    getHeight: () => 200,
    getMinWidth: () => 190,
  },

  /* ---------- Class Box ---------- */
  class: {
    draw: (model: any, kind: any, id: ID) => {
      const used = new Set<string>();
      const props: Record<string, number | "_"> = {};

      (kind.classVariables || []).forEach((p: any) => {
        const key = makeUniqueKey(p.name, used);
        props[key] = normalizeIdForRender(p.targetId); // "_" visible if unassigned
      });

      model.drawClass(0, 0, kind.className ?? "", id, props, false, style);
    },
    getHeight: () => 90,
    getMinWidth: () => 190,
  },
};
