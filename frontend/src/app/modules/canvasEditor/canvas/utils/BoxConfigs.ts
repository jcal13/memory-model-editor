const style = {
  box_id: { fill: "#fff", fillStyle: "solid" },
  box_type: { fill: "#fff", fillStyle: "solid" },
  box_container: { fill: "#fff", fillStyle: "solid" },
};

const getValues = (kind: any): number[] => {
  if (Array.isArray(kind.value)) {
    return kind.value.map((v: any) => +v).filter((v: number) => !isNaN(v));
  } else if (kind.value && typeof kind.value === "object") {
    return Object.values(kind.value)
      .map((v: any) => +v)
      .filter((v) => !isNaN(v));
  }
  return [];
};

export const BoxConfigs = {
  primitive: {
    draw: (model: any, kind: any, id: number) => {
      const type =
        kind.type === "None" || kind.value === null ? "None" : kind.type;
      const value = ["string", "number", "boolean"].includes(typeof kind.value)
        ? kind.value
        : "";
      model.drawPrimitive(0, 0, type, id, value, style);
    },
    getHeight: () => 90,
    getMinWidth: () => 170,
  },
  function: {
    draw: (model: any, kind: any, id: number) => {
      const props: Record<string, number | null> = {};
      (kind.params || []).forEach((p: any) => (props[p.name] = p.targetId));
      model.drawClass(0, 0, kind.functionName ?? "", id, props, true, style);
    },
    getHeight: () => 90,
    getMinWidth: () => 190,
  },
  list: {
    draw: (model: any, kind: any, id: number) => {
      const vals = getValues(kind);
      model.drawSequence(0, 0, "list", id, vals, vals.length > 0, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 100),
    getMinWidth: () => 190,
  },
  tuple: {
    draw: (model: any, kind: any, id: number) => {
      const vals = getValues(kind);
      model.drawSequence(0, 0, "tuple", id, vals, vals.length > 0, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 100),
    getMinWidth: () => 170,
  },
  set: {
    draw: (model: any, kind: any, id: number) => {
      const vals = getValues(kind);
      model.drawSet(0, 0, id, vals, style);
    },
    getHeight: (kind: any) => (getValues(kind).length > 0 ? 140 : 90),
    getMinWidth: () => 203,
  },
  dict: {
    draw: (model: any, kind: any, id: number) => {
      const dict =
        typeof kind.value === "object" && !Array.isArray(kind.value)
          ? kind.value
          : {};
      model.drawDict(0, 0, id, dict, style);
    },
    getHeight: () => 200,
    getMinWidth: () => 190,
  },
};
