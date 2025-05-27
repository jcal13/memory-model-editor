export type CanvasElement = {
  id: number;
  kind: ElementKind;
  x: number;
  y: number;
};
export type ElementKind =
  | PrimitiveValue
  | FunctionValue
  | ListValue
  | TupleValue
  | SetValue
  | DictValue;

type PrimitiveValue = {
  name: "primitive";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
};

type FunctionValue = {
  name: "function";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
};

type ListValue = {
  name: "list";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
};

type TupleValue = {
  name: "tuple";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
  items: Array<PrimitiveValue | FunctionValue | ListValue | SetValue | DictValue>;
};

type SetValue = {
  name: "set";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
};

type DictValue = {
  name: "dict";
  type: "int" | "str" | "bool" | "float";
  value: "null" | string;
  keyType: "int" | "str" | "bool" | "float";
  keyValue: "null" | string;
};

export type MemoryVizObject = {
  type: "int" | "str" | "bool" | "float";
  value: string | number | boolean;
  id: number;
};
