export type PrimitiveType = "None" | "int" | "float" | "str" | "bool";
export type CollectionType = "list" | "tuple" | "set" | "dict";
export type SpecialType = "function";

export type ValueType = PrimitiveType | CollectionType | SpecialType;

export interface PrimitiveKind {
  name: "primitive";
  type: PrimitiveType;
  value: string;
}

export type FunctionKind = {
  name: "function";
  type: "function";
  value: null;
  functionName: string;
  params: { name: string; targetId: number | null }[];
};

export interface ListKind {
  name: "list";
  type: "list";
  value: number[];
}

export interface TupleKind {
  name: "tuple";
  type: "tuple";
  value: number[];
}

export interface SetKind {
  name: "set";
  type: "set";
  value: number[];
}

export interface DictKind {
  name: "dict";
  type: "dict";
  value: Record<number, number | null>;
}

export type ElementKind =
  | PrimitiveKind
  | FunctionKind
  | ListKind
  | TupleKind
  | SetKind
  | DictKind;

export interface CanvasElement {
  boxId: number;
  id: number | "None";
  x: number;
  y: number;
  kind: ElementKind;
}