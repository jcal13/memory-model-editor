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

/**
 * Default dimensions for boxes
 */
export const DEFAULT_DIMENSIONS = {
  MIN_WIDTH: 170,
  MAX_WIDTH: 203,
  MIN_HEIGHT: 90,
  MAX_HEIGHT: 200,
  PRIMITIVE_WIDTH: 170,
  STANDARD_WIDTH: 190,
  SET_WIDTH: 203,
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
    // Handle list/tuple/set values
    return kind.value
      .map((v: any) => (v === "_" ? "_" : Number(v)))
      .filter((v: any) => v === "_" || !isNaN(v as number));
  }

  if (kind.value && typeof kind.value === "object") {
    // Handle dict values
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

  // Add invisible characters until we have a unique key
  while (used.has(key)) {
    key += "\u200B"; // Zero-width space
  }

  used.add(key);
  return key;
}

/**
 * Calculates the height for sequence-type boxes (list, tuple, set)
 *
 * @param kind - The kind object
 * @param emptyHeight - Height when empty
 * @param filledHeight - Height when containing items
 * @returns Calculated height
 */
export function getSequenceHeight(
  kind: any,
  emptyHeight: number = 100,
  filledHeight: number = 140
): number {
  const values = extractValues(kind);
  return values.length > 0 ? filledHeight : emptyHeight;
}

/**
 * Processes function parameters into a props object
 *
 * @param params - Array of parameter objects
 * @returns Object mapping parameter names to their target IDs
 */
export function processFunctionParams(
  params: any[] = []
): Record<string, number | "_"> {
  const used = new Set<string>();
  const props: Record<string, number | "_"> = {};

  params.forEach((param: any) => {
    const key = makeUniqueKey(param.name, used);
    props[key] = normalizeId(param.targetId);
  });

  return props;
}

/**
 * Processes class variables into a props object
 *
 * @param classVariables - Array of class variable objects
 * @returns Object mapping variable names to their target IDs
 */
export function processClassVariables(
  classVariables: any[] = []
): Record<string, number | "_"> {
  const used = new Set<string>();
  const props: Record<string, number | "_"> = {};

  classVariables.forEach((variable: any) => {
    const key = makeUniqueKey(variable.name, used);
    props[key] = normalizeId(variable.targetId);
  });

  return props;
}

/**
 * Safely extracts a dictionary object from kind.value
 *
 * @param kind - The kind object
 * @returns Dictionary object or empty object
 */
export function extractDictionary(kind: any): Record<string, any> {
  return typeof kind.value === "object" && !Array.isArray(kind.value)
    ? kind.value
    : {};
}
