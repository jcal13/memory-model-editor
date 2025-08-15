import { CanvasElement } from "../shared/types";

type FrameEntry = {
  type: ".frame";
  name: string;
  id: null;
  value: Record<string, number>;
  order: number;
};

type ValueEntry = {
  type: string;
  id: number | null;
  value: any;
  name?: string;
  x: number;
  y: number;
};

export function buildJSONFromElements(
  elements: CanvasElement[]
): (FrameEntry | ValueEntry)[] {
  const jsonData: FrameEntry[] = [];
  const valueEntries: ValueEntry[] = [];

  // Step 1: Add .frame entries for functions
  elements.forEach(({ id, kind }) => {
    if (kind.name === "function") {
      const frameValue: Record<string, number> = {};
      for (const param of kind.params || []) {
        if (param.targetId !== null) {
          frameValue[param.name] = param.targetId;
        }
      }
      jsonData.push({
        type: ".frame",
        name: kind.functionName || `func${id}`,
        id: null,
        value: frameValue,
        order: kind.order ?? 0,
      });
    }
  });

  // Step 2: Add value entries for everything else
  elements.forEach(({ id, kind, x, y }) => {
    let jsonId: number | null;
    if (typeof id === "number") {
      jsonId = id;
    } else if (id === "_") {
      jsonId = null;
    } else {
      console.warn(
        `Skipping value with non-numeric/non-blank id: ${String(id)}`
      );
      return;
    }
    if (kind.name === "primitive") {
      let parsed: string | number | boolean = kind.value;
      if (kind.type === "int") parsed = parseInt(kind.value, 10);
      else if (kind.type === "float") parsed = parseFloat(kind.value);
      else if (kind.type === "bool") parsed = kind.value === "true";

      valueEntries.push({
        type: kind.type,
        id: jsonId,
        value: parsed,
        x: x,
        y: y,
      });
    } else if (["list", "tuple", "set", "dict"].includes(kind.name)) {
      valueEntries.push({
        type: kind.type,
        id: jsonId,
        value: kind.value,
        x: x,
        y: y,
      });
    }
  });

  return [...jsonData, ...valueEntries];
}
