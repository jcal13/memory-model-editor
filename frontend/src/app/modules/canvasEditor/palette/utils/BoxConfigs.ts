/* =======================================
   === Style Config for RoughJS Drawing ==
======================================= */

const style = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
};

/* =======================================
   === Default Box Configurations (Palette)
   These are simplified versions for visual
   display only — no actual element data
======================================= */

export const BoxConfigs = {
  /* === Primitive Box === */
  primitive: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "None", 0, "", style);
    },
    minHeight: 90,
    minWidth: 170,
  },

  /* === Function Box === */
  function: {
    draw: (model: any) => {
      model.drawClass(5, 5, "__main__", 0, {}, true, style);
    },
    minHeight: 90,
    minWidth: 190,
  },

  /* === List Box === */
  list: {
    draw: (model: any) => {
      model.drawSequence(5, 5, "list", 0, [], true, style);
    },
    minHeight: 70,
    minWidth: 190,
  },

  /* === Tuple Box === */
  tuple: {
    draw: (model: any) => {
      model.drawSequence(15, 15, "tuple", 0, [], true, style);
    },
    minHeight: 70,
    minWidth: 170,
  },

  /* === Set Box === */
  set: {
    draw: (model: any) => {
      model.drawSet(5, 5, 0, [], style);
    },
    minHeight: 90,
    minWidth: 203,
  },

  /* === Dict Box === */
  dict: {
    draw: (model: any) => {
      model.drawDict(5, 5, 0, {}, style);
    },
    minHeight: 200,
    minWidth: 190,
  },
};
