import { CanvasElement } from "../shared/types";

type FrameEntry = {
  type: ".frame";
  name: string;
  id: null;
  value: Record<string, number>;
};

type ValueEntry = {
  type: string;
  id: number;
  value: any;
  name?: string;
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
      });
    }
  });

  // Step 2: Add value entries for everything else
  elements.forEach(({ id, kind }) => {
    if (typeof id !== "number") {
      console.warn(`Skipping value with non-numeric id: ${id}`);
      return;
    }

    if (kind.name === "primitive") {
      let parsed: string | number | boolean = kind.value;
      if (kind.type === "int") parsed = parseInt(kind.value, 10);
      else if (kind.type === "float") parsed = parseFloat(kind.value);
      else if (kind.type === "bool") parsed = kind.value === "true";

      valueEntries.push({
        type: kind.type,
        id,
        value: parsed,
      });
    } else if (["list", "tuple", "set", "dict"].includes(kind.name)) {
      valueEntries.push({
        type: kind.type,
        id,
        value: kind.value,
      });
    }
  });

  return [...jsonData, ...valueEntries];
}