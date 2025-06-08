import MemoryViz from "memory-viz";
import { CanvasElement } from "../shared/types";

export function createBoxRenderer(element: CanvasElement): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const kind: any = element.kind;
  let values: number[] = [];

  if (Array.isArray(kind.value)) {
    values = kind.value
      .map((v: any) => (typeof v === "number" ? v : Number(v)))
      .filter((v: any) => !isNaN(v));
  } else if (kind.value && typeof kind.value === "object") {
    values = Object.values(kind.value)
      .map((v: any) => (typeof v === "number" ? v : Number(v)))
      .filter((v) => !isNaN(v));
  }

  const config = {
    obj_min_width: 190,
    obj_min_height: 90,
    prop_min_width: 60,
    prop_min_height: 40,
    double_rect_sep: 10,
    font_size: 18,
    browser: true,
    roughjs_config: { options: { fillStyle: "solid" } },
  };

  switch (kind.name) {
    case "primitive":
    case "function":
      config.obj_min_height = 90;
      break;
    case "dict":
      config.obj_min_height = 200;
      break;
    case "list":
    case "tuple":
      config.obj_min_height = values.length > 0 ? 140 : 100;
      break;
    case "set":
      config.obj_min_height = values.length > 0 ? 140 : 90;
      break;
  }

  const model = new MemoryModel(config);

  const style = {
    box_id: { fill: "#fff", fillStyle: "solid" },
    box_type: { fill: "#fff", fillStyle: "solid" },
    box_container: { fill: "#fff", fillStyle: "solid" }, 
  };

  switch (kind.name) {
    case "primitive": {
      const primitiveType = kind.type === "None" || kind.value === null ? "None" : kind.type;
      const primitiveValue =
        typeof kind.value === "string" || typeof kind.value === "number" || typeof kind.value === "boolean"
          ? kind.value
          : "";
      model.drawPrimitive(0, 0, primitiveType, Number(element.id), primitiveValue, style);
      break;
    }
    case "function": {
      const props: Record<string, number | null> = {};
      if ("params" in kind && Array.isArray(kind.params)) {
        kind.params.forEach((p: { name: string; targetId: number | null }) => {
          props[p.name] = p.targetId;
        });
      }
      model.drawClass(0, 0, kind.functionName, Number(element.id), props, true, style);
      break;
    }
    case "dict": {
      const dictValue = typeof kind.value === "object" && kind.value !== null ? kind.value : {};
      model.drawDict(0, 0, Number(element.id), dictValue, style);
      break;
    }
    case "list":
    case "tuple": {
      const showIndices = values.length > 0;
      model.drawSequence(0, 0, kind.name, Number(element.id), values, showIndices, style);
      break;
    }
    case "set": {
      model.drawSet(0, 0, Number(element.id), values, style);
      break;
    }
  }

  return model.svg;
}
