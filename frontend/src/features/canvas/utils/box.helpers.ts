/**
 * Utility functions for box configuration and rendering
 */

/**
 * Shared SVG styles for all box types
 */
export const BOX_STYLES = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
} as const;

export const DEFAULT_DIMENSIONS = {
  MIN_WIDTH: 153,
  MAX_WIDTH: 183,
  MIN_HEIGHT: 78,
  MAX_HEIGHT: 180,
  PRIMITIVE_WIDTH: 153,
  STANDARD_WIDTH: 171,
  SET_WIDTH: 183,
} as const;

/**
 * Extracts numeric values from an element's kind.value
 * Handles arrays (list, tuple, set) and objects (dict)
 *
 * @param kind - The kind object containing a value field
 * @returns Array of numeric values or "_" for placeholders
 */
export function extractValues(kind: any): (number | "_")[] {
  if (Array.isArray(kind.value)) {
    return kind.value
      .map((v: any) => (v === "_" ? "_" : Number(v)))
      .filter((v: any) => v === "_" || !isNaN(v as number));
  }

  if (kind.value && typeof kind.value === "object") {
    return Object.values(kind.value)
      .map((v: any) => Number(v))
      .filter((v) => !isNaN(v as number));
  }

  return [];
}

/**
 * Normalizes an ID value for rendering
 * Returns the ID if it's a valid integer, otherwise returns "_"
 *
 * @param value - The value to normalize
 * @returns Normalized ID or placeholder
 */
export function normalizeId(value: unknown): number | "_" {
  return typeof value === "number" && Number.isInteger(value) ? value : "_";
}

/**
 * Creates a unique key by appending zero-width spaces if needed
 * Used to handle duplicate property names visually
 *
 * @param raw - The raw key value
 * @param used - Set of already used keys
 * @returns A unique key string
 */
export function makeUniqueKey(raw: unknown, used: Set<string>): string {
  const base = typeof raw === "string" ? raw : "";
  let key = base;

  while (used.has(key)) {
    key += "\u200B";
  }

  used.add(key);
  return key;
}

/**
 * @param kind - The kind object
 * @param emptyHeight - Height when empty
 * @param filledHeight - Height when containing items
 * @returns Calculated height
 */
export function getSequenceHeight(
  kind: any,
  emptyHeight: number = 78,
  filledHeight: number = 126
): number {
  const values = extractValues(kind);
  return values.length > 0 ? filledHeight : emptyHeight;
}

/**
 * Processes function parameters into the format expected by MemoryViz
 *
 * @param params - Array of parameter objects with key-value pairs
 * @returns Processed parameters object
 */
export function processFunctionParams(params: any[]): Record<string, any> {
  if (!Array.isArray(params)) return {};

  const used = new Set<string>();
  return params.reduce((acc, param) => {
    const key = makeUniqueKey(param.name, used);
    acc[key] = normalizeId(param.targetId);
    return acc;
  }, {} as Record<string, any>);
}
/**
 * Processes class variables into the format expected by MemoryViz
 *
 * @param variables - Array of variable objects with key-value pairs
 * @returns Processed variables object
 */
export function processClassVariables(variables: any[]): Record<string, any> {
  if (!Array.isArray(variables)) return {};

  const used = new Set<string>();
  return variables.reduce((acc, variable) => {
    const key = makeUniqueKey(variable.key, used);
    acc[key] = normalizeId(variable.value);
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Extracts and processes dictionary key-value pairs
 *
 * @param kind - The kind object containing dictionary data
 * @returns Processed dictionary object
 */
export function extractDictionary(kind: any): Record<string, any> {
  if (!kind.pairs || !Array.isArray(kind.pairs)) return {};

  const used = new Set<string>();
  return kind.pairs.reduce((acc: Record<string, any>, pair: any) => {
    const key = makeUniqueKey(pair.key, used);
    acc[key] = normalizeId(pair.value);
    return acc;
  }, {} as Record<string, any>);
}
