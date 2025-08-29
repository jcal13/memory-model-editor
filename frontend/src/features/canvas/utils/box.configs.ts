import { ID } from "../../shared/types";
import { BoxTypeConfig } from "./box.types";
import {
  BOX_STYLES,
  DEFAULT_DIMENSIONS,
  extractValues,
  getSequenceHeight,
  processFunctionParams,
  processClassVariables,
  extractDictionary,
} from "./box.helpers";

/**
 * Configuration map for all supported box types
 * Each entry defines how to draw, size, and configure specific element types
 */
export const BOX_CONFIGS: Record<string, BoxTypeConfig> = {
  /* ========== Primitive Box ========== */
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

      model.drawPrimitive(0, 0, type, id, value, BOX_STYLES);
    },
    getHeight: () => DEFAULT_DIMENSIONS.MIN_HEIGHT,
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
  },

  /* ========== Function Box ========== */
  function: {
    draw: (model: any, kind: any, id: ID) => {
      const props = processFunctionParams(kind.params);
      model.drawClass(
        0,
        0,
        kind.functionName ?? "",
        id,
        props,
        true,
        BOX_STYLES
      );
    },
    getHeight: () => DEFAULT_DIMENSIONS.MIN_HEIGHT,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
  },

  /* ========== List Box ========== */
  list: {
    draw: (model: any, kind: any, id: ID) => {
      const values = extractValues(kind);
      model.drawSequence(
        0,
        0,
        "list",
        id,
        values,
        values.length > 0,
        BOX_STYLES
      );
    },
    getHeight: (kind: any) => getSequenceHeight(kind),
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
  },

  /* ========== Tuple Box ========== */
  tuple: {
    draw: (model: any, kind: any, id: ID) => {
      const values = extractValues(kind);
      model.drawSequence(
        0,
        0,
        "tuple",
        id,
        values,
        values.length > 0,
        BOX_STYLES
      );
    },
    getHeight: (kind: any) => getSequenceHeight(kind),
    getMinWidth: () => DEFAULT_DIMENSIONS.PRIMITIVE_WIDTH,
  },

  /* ========== Set Box ========== */
  set: {
    draw: (model: any, kind: any, id: ID) => {
      const values = extractValues(kind);
      model.drawSet(0, 0, id, values, BOX_STYLES);
    },
    getHeight: (kind: any) => getSequenceHeight(kind, 90, 140),
    getMinWidth: () => DEFAULT_DIMENSIONS.SET_WIDTH,
  },

  /* ========== Dictionary Box ========== */
  dict: {
    draw: (model: any, kind: any, id: ID) => {
      const dictionary = extractDictionary(kind);
      model.drawDict(0, 0, id, dictionary, BOX_STYLES);
    },
    getHeight: () => DEFAULT_DIMENSIONS.MAX_HEIGHT,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
  },

  /* ========== Class Box ========== */
  class: {
    draw: (model: any, kind: any, id: ID) => {
      const props = processClassVariables(kind.classVariables);
      model.drawClass(0, 0, kind.className ?? "", id, props, false, BOX_STYLES);
    },
    getHeight: () => DEFAULT_DIMENSIONS.MIN_HEIGHT,
    getMinWidth: () => DEFAULT_DIMENSIONS.STANDARD_WIDTH,
  },
};
