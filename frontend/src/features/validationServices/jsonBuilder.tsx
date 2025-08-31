import { CanvasElement } from "../shared/types";

// Types for JSON structure
interface FrameEntry {
  type: ".frame";
  name: string;
  id: null;
  value: Record<string, number | null>;
  order: number;
}

interface ValueEntry {
  type: string;
  id: number | null;
  value: any;
  name?: string;
  x: number;
  y: number;
}

type JSONEntry = FrameEntry | ValueEntry;

/**
 * Normalizes an unknown value to a valid ID (number or null)
 * @param value - The value to normalize
 * @returns A valid ID or null
 */
const normalizeId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (value === "_" || value === null) {
    return null;
  }
  return null;
};

/**
 * Normalizes an array of unknown values to valid IDs
 * @param arr - The array to normalize
 * @returns Array of valid IDs
 */
const normalizeIdArray = (arr: unknown): Array<number | null> => {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map((value) => normalizeId(value));
};

/**
 * Normalizes an object to a dictionary of valid IDs
 * @param obj - The object to normalize
 * @returns Dictionary with valid IDs as values
 */
const normalizeIdDict = (obj: unknown): Record<string, number | null> => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return {};
  }

  const result: Record<string, number | null> = {};
  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    result[key] = normalizeId(value);
  });
  return result;
};

/**
 * Creates a unique key by appending zero-width spaces if needed
 * @param rawKey - The raw key to make unique
 * @param usedKeys - Set of already used keys
 * @returns A unique key
 */
const makeUniqueKey = (rawKey: unknown, usedKeys: Set<string>): string => {
  const baseKey = typeof rawKey === "string" ? rawKey : "";
  let uniqueKey = baseKey;

  while (usedKeys.has(uniqueKey)) {
    uniqueKey += "\u200B"; // Zero-width space
  }

  usedKeys.add(uniqueKey);
  return uniqueKey;
};

/**
 * Parses a primitive value based on its type
 * @param type - The primitive type
 * @param value - The raw value to parse
 * @returns The parsed value
 */
const parsePrimitiveValue = (type: string, value: string): any => {
  if (type === "None" || value === "null" || value === null) {
    return null;
  }

  switch (type) {
    case "int":
      return parseInt(value, 10);
    case "float":
      return parseFloat(value);
    case "bool":
      return value === "true";
    default:
      return value;
  }
};

/**
 * Processes function elements and creates frame entries
 * @param elements - Canvas elements to process
 * @returns Array of frame entries
 */
const processFunctionFrames = (elements: CanvasElement[]): FrameEntry[] => {
  const frameEntries: FrameEntry[] = [];

  elements.forEach(({ id, kind }) => {
    if (kind.name !== "function") return;

    const usedKeys = new Set<string>();
    const frameValue: Record<string, number | null> = {};

    for (const param of kind.params || []) {
      const key = makeUniqueKey(param.name, usedKeys);
      frameValue[key] = normalizeId(param.targetId);
    }

    frameEntries.push({
      type: ".frame",
      name: kind.functionName || `func${id}`,
      id: null,
      value: frameValue,
      order: kind.order ?? 0,
    });
  });

  return frameEntries;
};

/**
 * Processes non-function elements and creates value entries
 * @param elements - Canvas elements to process
 * @returns Array of value entries
 */
const processValueEntries = (elements: CanvasElement[]): ValueEntry[] => {
  const valueEntries: ValueEntry[] = [];

  elements.forEach(({ id, kind, x, y }) => {
    if (kind.name === "function") return;

    const jsonId = normalizeId(id);
    if (jsonId === null && id !== "_" && id !== null) {
      console.warn(
        `Skipping value with non-numeric/non-blank id: ${String(id)}`
      );
      return;
    }

    switch (kind.name) {
      case "primitive":
        valueEntries.push({
          type: kind.type,
          id: jsonId,
          value: parsePrimitiveValue(kind.type, kind.value),
          x,
          y,
        });
        break;

      case "list":
      case "tuple":
      case "set":
        valueEntries.push({
          type: kind.type,
          id: jsonId,
          value: normalizeIdArray(kind.value),
          x,
          y,
        });
        break;

      case "dict":
        valueEntries.push({
          type: kind.type,
          id: jsonId,
          value: normalizeIdDict(kind.value),
          x,
          y,
        });
        break;

      case "class":
        const usedKeys = new Set<string>();
        const classVariables: Record<string, number | null> = {};

        for (const variable of kind.classVariables || []) {
          const key = makeUniqueKey(variable.name, usedKeys);
          classVariables[key] = normalizeId(variable.targetId);
        }

        valueEntries.push({
          type: kind.type,
          id: jsonId,
          name: kind.className ?? "NoClass",
          value: classVariables,
          x,
          y,
        });
        break;
    }
  });

  return valueEntries;
};

/**
 * Builds JSON data from canvas elements for validation
 * @param elements - Array of canvas elements
 * @returns Combined array of frame entries and value entries
 */
export function buildJSONFromElements(elements: CanvasElement[]): JSONEntry[] {
  const frameEntries = processFunctionFrames(elements);
  const valueEntries = processValueEntries(elements);

  return [...frameEntries, ...valueEntries];
}
