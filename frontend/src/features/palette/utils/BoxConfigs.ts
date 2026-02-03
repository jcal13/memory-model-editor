import { BoxConfig, BoxStyle } from "../shared/types";

const DEFAULT_STYLE: BoxStyle = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
};

export const BoxConfigs: Record<string, BoxConfig> = {
  /* ---------- "None" placeholder ---------- */
  primitive: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "NoneType", "None", "", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  /* ---------- Concrete primitives ---------- */
  none: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "NoneType", "0", "None", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  int: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "int", "0", "0", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  float: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "float", "0", "0.0", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  str: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "str", "0", "", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  bool: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "bool", "0", "", DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 153,
  },

  /* ---------- Function ---------- */
  function: {
    draw: (model: any) => {
      model.drawClass(5, 5, "__main__", 0, {}, true, DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 171,
  },

  /* ---------- Collections ---------- */
  list: {
    draw: (model: any) => {
      model.drawSequence(5, 5, "list", 0, [], true, DEFAULT_STYLE);
    },
    minHeight: 63,
    minWidth: 171,
  },

  tuple: {
    draw: (model: any) => {
      model.drawSequence(15, 15, "tuple", 0, [], true, DEFAULT_STYLE);
    },
    minHeight: 63,
    minWidth: 153,
  },

  set: {
    draw: (model: any) => {
      model.drawSet(5, 5, 0, [], DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 183,
  },

  dict: {
    draw: (model: any) => {
      model.drawDict(5, 5, 0, {}, DEFAULT_STYLE);
    },
    minHeight: 180,
    minWidth: 171,
  },

  /* ---------- Class ---------- */
  class: {
    draw: (model: any) => {
      model.drawClass(5, 5, "class", 0, {}, false, DEFAULT_STYLE);
    },
    minHeight: 81,
    minWidth: 171,
  },
} as const;
