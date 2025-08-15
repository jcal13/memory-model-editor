import { CanvasElement } from "../shared/types";

type FrameEntry = {
  type: ".frame";
  name: string;
  id: null;
  value: Record<string, number | null>;
  order: number;
};

type ValueEntry = {
  type: string;
  id: number | null;
  value: any;
  name?: string;
  x: number;
  y: number;
};

const normalizeId = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (v === "_" || v === null) return null;
  return null;
};

const normalizeIdArray = (arr: unknown): Array<number | null> => {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => normalizeId(v));
};

const normalizeIdDict = (obj: unknown): Record<string, number | null> => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, number | null> = {};
  Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
    out[k] = normalizeId(v);
  });
  return out;
};

export function buildJSONFromElements(
  elements: CanvasElement[]
): (FrameEntry | ValueEntry)[] {
  const jsonData: FrameEntry[] = [];
  const valueEntries: ValueEntry[] = [];

  // Step 1: Add .frame entries for functions
  elements.forEach(({ id, kind }) => {
    if (kind.name === "function") {
      const frameValue: Record<string, number | null> = {};
      for (const param of kind.params || []) {
        frameValue[param.name] = normalizeId(param.targetId);
      }
      jsonData.push({
        type: ".frame",
        name: kind.functionName || `func${id}`,
        id: null,
        value: frameValue,
        order: kind.order ?? 0,
      });
    }
  });

  // Step 2: Add value entries for everything else
  elements.forEach(({ id, kind, x, y }) => {
    const jsonId = normalizeId(id);
    if (jsonId === null && id !== "_" && id !== null) {
      console.warn(
        `Skipping value with non-numeric/non-blank id: ${String(id)}`
      );
      return;
    }

    if (kind.name === "primitive") {
      let parsed: string | number | boolean | null = kind.value;

      if (kind.type === "None" || parsed === "null" || parsed === null) {
        parsed = null;
      } else if (kind.type === "int") {
        parsed = parseInt(kind.value, 10);
      } else if (kind.type === "float") {
        parsed = parseFloat(kind.value);
      } else if (kind.type === "bool") {
        parsed = kind.value === "true";
      }

      valueEntries.push({
        type: kind.type,
        id: jsonId,
        value: parsed,
        x,
        y,
      });
    } else if (
      kind.name === "list" ||
      kind.name === "tuple" ||
      kind.name === "set"
    ) {
      valueEntries.push({
        type: kind.type,
        id: jsonId,
        value: normalizeIdArray(kind.value),
        x,
        y,
      });
    } else if (kind.name === "dict") {
      valueEntries.push({
        type: kind.type,
        id: jsonId,
        value: normalizeIdDict(kind.value),
        x,
        y,
      });
    } else if (kind.name == "class") {
      const frameValue: Record<string, number> = {};
      for (const variable of kind.classVariables || []) {
        if (variable.targetId !== null) {
          frameValue[variable.name] = variable.targetId;
        }
      }
      valueEntries.push({
        type: kind.type,
        name: kind.className,
        id: normalizeId(id),
        value: frameValue,
        x: x,
        y: y,
      });
    }
  });

  return [...jsonData, ...valueEntries];
}
