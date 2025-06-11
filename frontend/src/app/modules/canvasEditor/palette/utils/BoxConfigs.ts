const style = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
};

export const BoxConfigs = {
  primitive: {
    draw: (model: any) => {
      model.drawPrimitive(15, 15, "None", 0, "", style);
    },
    minHeight: 90,
    minWidth: 170,
  },
  function: {
    draw: (model: any) => {
      model.drawClass(5, 5, "__main__", 0, {}, true, style);
    },
    minHeight: 90,
    minWidth: 190,
  },
  list: {
    draw: (model: any) => {
      model.drawSequence(5, 5, "list", 0, [], true, style);
    },
    minHeight: 70,
    minWidth: 190,
  },
  tuple: {
    draw: (model: any) => {
      model.drawSequence(15, 15, "tuple", 0, [], true, style);
    },
    minHeight: 70,
    minWidth: 170,
  },
  set: {
    draw: (model: any) => {
      model.drawSet(5, 5, 0, [], style);
    },
    minHeight: 90,
    minWidth: 203,
  },
  dict: {
    draw: (model: any) => {
      model.drawDict(5, 5, 0, {}, style);
    },
    minHeight: 200,
    minWidth: 190,
  },
};
