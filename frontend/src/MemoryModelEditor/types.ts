export type CanvasElement = {
  id: number;
  kind: ElementKind;
  x: number;
  y: number;
};
export type ElementKind = PrimitiveValue;

type PrimitiveValue = {
  name: "primitive";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
};

export type MemoryVizObject = {
  type: "int" | "str" | "bool" | "float";
  value: string | number | boolean;
  id: number;
};
