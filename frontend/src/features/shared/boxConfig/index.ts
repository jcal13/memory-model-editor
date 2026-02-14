/**
 * Unified Box Configuration System
 *
 * This module provides a centralized configuration for all box types used in both:
 * - Canvas rendering (with dynamic content, error styling, and complex layouts)
 * - Palette rendering (static preview boxes with simple styling)
 *
 * By unifying these configurations, we ensure consistency across the application
 * and make it easier to add new box types or modify existing ones.
 */

import { ID } from "../types";
import {
  extractValues,
  getSequenceHeight,
  processFunctionParams,
  processClassVariables,
  extractDictionary,
} from "../../canvas/utils/box.helpers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Style configuration for box rendering
 */
export interface BoxStyle {
  box_id: { fill: string; fillStyle: string };
  box_type: { fill: string; fillStyle: string };
  box_container?: { fill: string; fillStyle: string };
}

/**
 * Rendering context - determines which rendering mode to use
 */
export type RenderContext = "canvas" | "palette";

/**
 * Configuration for a box type renderer
 */
export interface BoxTypeConfig<TKind = any> {
  /**
   * Renders the box in canvas mode (with full element data)
   * @param model - MemoryViz model instance
   * @param kind - Element kind/data
   * @param id - Element ID
   * @param style - Box styling
   */
  drawCanvas: (model: any, kind: TKind, id: ID, style: BoxStyle) => void;

  /**
   * Renders the box in palette mode (static preview)
   * @param model - MemoryViz model instance
   * @param style - Box styling
   */
  drawPalette: (model: any, style: BoxStyle) => void;

  /**
   * Returns the height for this box type in canvas mode
   * @param kind - Element kind/data (optional, for dynamic sizing)
   */
  getHeight: (kind?: TKind) => number;

  /**
   * Returns the minimum width for this box type
   */
  getMinWidth: () => number;

  /**
   * Palette-specific minimum height (static preview)
   */
  paletteMinHeight: number;

  /**
   * Palette-specific minimum width (static preview)
   */
  paletteMinWidth: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default dimensions for box rendering (canvas mode)
 * Matches the values from canvas/utils/box.helpers.ts
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
 * Default palette offset for preview rendering
 */
export const PALETTE_OFFSET = { x: 15, y: 15 } as const;
export const PALETTE_OFFSET_SMALL = { x: 5, y: 5 } as const;

/**
 * Get the appropriate box fill color based on current theme
 */
function getBoxFillColor(): string {
  if (typeof document !== 'undefined') {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDarkMode ? '#2d3748' : '#ffffff';
  }
  return '#ffffff';
}

/**
 * Default style for canvas boxes
 */
export const DEFAULT_CANVAS_STYLE: BoxStyle = {
  get box_id() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
  get box_type() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
  get box_container() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
};

/**
 * Default style for palette preview boxes
 */
export const DEFAULT_PALETTE_STYLE: BoxStyle = {
  get box_id() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
  get box_type() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
  get box_container() { return { fill: getBoxFillColor(), fillStyle: "solid" as const }; },
};

// ============================================================================
// HELPER FUNCTIONS - Re-exported from canvas utils for consistency
// ============================================================================

// Helper functions are imported at the top and re-exported here for convenience
export {
  extractValues,
  getSequenceHeight,
  processFunctionParams,
  processClassVariables,
  extractDictionary,
};

// ============================================================================
// BOX TYPE CONFIGURATIONS
// ============================================================================

/**
 * Unified configuration map for all supported box types
 *
 * Each box type defines:
 * - How to render in canvas mode (with element data)
 * - How to render in palette mode (static preview)
 * - Sizing information for both contexts
 */
export const BOX_TYPE_CONFIGS: Record<string, BoxTypeConfig> = {
  /* ========== Primitive Box ========== */
  primitive: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const isNone = kind.type === "NoneType" || kind.type === "None" || kind.value === null;
      const type = isNone ? "NoneType" : kind.type;

      let value: any;
      if (isNone) {
        value = "None";
      } else if (["string", "number", "boolean"].includes(typeof kind.value)) {
        value = kind.type === "bool" ? kind.value === "true" : kind.value;
      } else {
        value = "";
      }

      model.drawPrimitive(0, 0, type, id, value, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(
        PALETTE_OFFSET.x,
        PALETTE_OFFSET.y,
        "NoneType",
        "None",
        "",
        style
      );
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== None Type ========== */
  none: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      model.drawPrimitive(0, 0, "NoneType", id, "None", style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(
        PALETTE_OFFSET.x,
        PALETTE_OFFSET.y,
        "NoneType",
        "0",
        "None",
        style
      );
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== Integer Box ========== */
  int: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      model.drawPrimitive(0, 0, "int", id, kind.value ?? 0, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(PALETTE_OFFSET.x, PALETTE_OFFSET.y, "int", "0", "0", style);
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== Float Box ========== */
  float: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      model.drawPrimitive(0, 0, "float", id, kind.value ?? 0.0, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(
        PALETTE_OFFSET.x,
        PALETTE_OFFSET.y,
        "float",
        "0",
        "0.0",
        style
      );
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== String Box ========== */
  str: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      model.drawPrimitive(0, 0, "str", id, kind.value ?? "", style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(PALETTE_OFFSET.x, PALETTE_OFFSET.y, "str", "0", "", style);
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== Boolean Box ========== */
  bool: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const value = kind.value === "true" || kind.value === true;
      model.drawPrimitive(0, 0, "bool", id, value, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawPrimitive(PALETTE_OFFSET.x, PALETTE_OFFSET.y, "bool", "0", "", style);
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 153,
  },

  /* ========== Function Box ========== */
  function: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const props = processFunctionParams(kind.params);
      model.drawClass(
        0,
        0,
        kind.functionName ?? "",
        id,
        props,
        true,
        style
      );
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawClass(
        PALETTE_OFFSET_SMALL.x,
        PALETTE_OFFSET_SMALL.y,
        "function",
        0,
        {},
        true,
        style
      );
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 171,
  },

  /* ========== List Box ========== */
  list: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const values = extractValues(kind);
      model.drawSequence(
        0,
        0,
        "list",
        id,
        values,
        values.length > 0,
        style
      );
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawSequence(
        PALETTE_OFFSET_SMALL.x,
        PALETTE_OFFSET_SMALL.y,
        "list",
        0,
        [],
        true,
        style
      );
    },
    getHeight: (kind: any) => getSequenceHeight(kind),
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
    paletteMinHeight: 63,
    paletteMinWidth: 171,
  },

  /* ========== Tuple Box ========== */
  tuple: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const values = extractValues(kind);
      model.drawSequence(
        0,
        0,
        "tuple",
        id,
        values,
        values.length > 0,
        style
      );
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawSequence(
        PALETTE_OFFSET.x,
        PALETTE_OFFSET.y,
        "tuple",
        0,
        [],
        true,
        style
      );
    },
    getHeight: (kind: any) => getSequenceHeight(kind),
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
    paletteMinHeight: 63,
    paletteMinWidth: 153,
  },

  /* ========== Set Box ========== */
  set: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const values = extractValues(kind);
      model.drawSet(0, 0, id, values, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawSet(PALETTE_OFFSET_SMALL.x, PALETTE_OFFSET_SMALL.y, 0, [], style);
    },
    getHeight: (kind: any) => getSequenceHeight(kind, 90, 140),
    getMinWidth: () => DEFAULT_DIMENSIONS.SET_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 183,
  },

  /* ========== Dictionary Box ========== */
  dict: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const dictionary = extractDictionary(kind);
      model.drawDict(0, 0, id, dictionary, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawDict(PALETTE_OFFSET_SMALL.x, PALETTE_OFFSET_SMALL.y, 0, {}, style);
    },
    getHeight: () => DEFAULT_DIMENSIONS.MAX_HEIGHT,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
    paletteMinHeight: 180,
    paletteMinWidth: 171,
  },

  /* ========== Class Box ========== */
  class: {
    drawCanvas: (model: any, kind: any, id: ID, style: BoxStyle) => {
      const props = processClassVariables(kind.classVariables);
      model.drawClass(0, 0, kind.className ?? "", id, props, false, style);
    },
    drawPalette: (model: any, style: BoxStyle) => {
      model.drawClass(
        PALETTE_OFFSET_SMALL.x,
        PALETTE_OFFSET_SMALL.y,
        "class",
        0,
        {},
        false,
        style
      );
    },
    getHeight: () => 78,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
    paletteMinHeight: 81,
    paletteMinWidth: 171,
  },
};

/**
 * Retrieves the box configuration for a specific box type.
 * Falls back to primitive configuration if the type is not found.
 *
 * @param boxType - The type of box to retrieve configuration for
 * @returns Box type configuration with rendering and sizing information
 *
 * @example
 * const config = getBoxConfig('function');
 * config.drawCanvas(model, kind, id, style);
 */
export function getBoxConfig(boxType: string): BoxTypeConfig {
  return BOX_TYPE_CONFIGS[boxType] ?? BOX_TYPE_CONFIGS.primitive;
}

/**
 * Returns an array of all registered box type names.
 *
 * @returns Array of box type identifier strings
 *
 * @example
 * const types = getAvailableBoxTypes();
 * // ['primitive', 'function', 'list', 'tuple', ...]
 */
export function getAvailableBoxTypes(): string[] {
  return Object.keys(BOX_TYPE_CONFIGS);
}

/**
 * Registers a new box type configuration dynamically.
 * Allows extending the system with custom box types at runtime.
 *
 * @param typeName - Unique identifier for the new box type
 * @param config - Complete box type configuration
 *
 * @example
 * registerBoxType('customType', {
 *   drawCanvas: (model, kind, id, style) => { ... },
 *   drawPalette: (model, style) => { ... },
 *   getHeight: () => 78,
 *   getMinWidth: () => 171,
 *   paletteMinHeight: 81,
 *   paletteMinWidth: 171,
 * });
 */
export function registerBoxType(typeName: string, config: BoxTypeConfig): void {
  BOX_TYPE_CONFIGS[typeName] = config;
}
