/**
 * Utility functions for processing and transforming box element data.
 * These helpers extract, normalize, and format data for MemoryViz rendering.
 */

/**
 * Default SVG styling configuration applied to all box types.
 * Provides white fill with solid styling for consistent rendering.
 */
export const BOX_STYLES = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
} as const;

/**
 * Standard dimension constants for box rendering.
 * Values are in SVG coordinate units.
 */
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
 * Extracts and normalizes values from collection-type elements.
 * Handles arrays (list, tuple, set) and objects (dict), filtering out invalid entries.
 *
 * @param kind - Element kind object containing a value property
 * @returns Array of numeric values or underscore placeholders for unassigned references
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
 * Normalizes an ID value to either a valid integer or placeholder.
 * Used to ensure ID references are properly formatted for MemoryViz.
 *
 * @param value - Value to normalize (can be any type)
 * @returns Integer ID if valid, underscore placeholder otherwise
 */
export function normalizeId(value: unknown): number | "_" {
  return typeof value === "number" && Number.isInteger(value) ? value : "_";
}

/**
 * Generates a unique key string by appending zero-width spaces to duplicates.
 * Prevents key collisions in object properties while maintaining visual appearance.
 *
 * @param raw - Raw key value (typically a string)
 * @param used - Set tracking already-used keys
 * @returns Unique key string (may contain invisible zero-width spaces)
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
 * Calculates the appropriate height for sequence-based collection boxes.
 * Returns different heights based on whether the collection is empty or filled.
 *
 * @param kind - Element kind object containing collection values
 * @param emptyHeight - Height to use when collection is empty (default: 78)
 * @param filledHeight - Height to use when collection has items (default: 126)
 * @returns Calculated height in SVG units
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
 * Transforms function parameter data into MemoryViz-compatible format.
 * Handles duplicate parameter names using zero-width spaces for uniqueness.
 *
 * @param params - Array of parameter objects with name and targetId properties
 * @returns Object mapping parameter names to normalized ID values
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
 * Transforms class instance variable data into MemoryViz-compatible format.
 * Handles duplicate variable names using zero-width spaces for uniqueness.
 *
 * @param variables - Array of variable objects with name/key and targetId/value properties
 * @returns Object mapping variable names to normalized ID values
 */
export function processClassVariables(variables: any[]): Record<string, any> {
  if (!Array.isArray(variables)) return {};

  const used = new Set<string>();
  return variables.reduce((acc, variable) => {
    const key = makeUniqueKey(variable.name ?? variable.key, used);
    acc[key] = normalizeId(variable.targetId ?? variable.value);
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Extracts and processes dictionary key-value pairs into MemoryViz format.
 * Ensures all keys are unique by appending zero-width spaces to duplicates.
 *
 * @param kind - Element kind object containing pairs array
 * @returns Object mapping dictionary keys to normalized values
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
