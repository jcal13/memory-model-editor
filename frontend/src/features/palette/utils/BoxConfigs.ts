import { BoxConfig, BoxStyle } from "../shared/types";

/* =======================================
   === Style Config for RoughJS Drawing ==
======================================= */

const DEFAULT_STYLE: BoxStyle = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
};

/* =======================================
   === Box Configurations (Palette)
   One entry per visible palette box
======================================= */

export const BoxConfigs: Record<string, BoxConfig> = {
  /* ---------- "None" placeholder ---------- */
  primitive: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "None", "None", "", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },

  /* ---------- Concrete primitives ---------- */
  none: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "None", "0", "null", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },
  int: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "int", "0", "0", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },
  float: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "float", "0", "0.0", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },
  str: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "str", "0", "", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },
  bool: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "bool", "0", "", DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 170,
  },

  /* ---------- Function ---------- */
  function: {
    draw: (model: any) => {
      model.drawClass(5, 5, "__main__", 0, {}, true, DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 190,
  },

  /* ---------- Collections ---------- */
  list: {
    draw: (model: any) => {
      model.drawSequence(5, 5, "list", 0, [], true, DEFAULT_STYLE);
    },
    minHeight: 70,
    minWidth: 190,
  },
  tuple: {
    draw: (model: any) => {
      model.drawSequence(15, 15, "tuple", 0, [], true, DEFAULT_STYLE);
    },
    minHeight: 70,
    minWidth: 170,
  },
  set: {
    draw: (model: any) => {
      model.drawSet(5, 5, 0, [], DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 203,
  },
  dict: {
    draw: (model: any) => {
      model.drawDict(5, 5, 0, {}, DEFAULT_STYLE);
    },
    minHeight: 200,
    minWidth: 190,
  },

  /* ---------- Class ---------- */
  class: {
    draw: (model: any) => {
      model.drawClass(5, 5, "class", 0, {}, false, DEFAULT_STYLE);
    },
    minHeight: 90,
    minWidth: 190,
  },
} as const;
