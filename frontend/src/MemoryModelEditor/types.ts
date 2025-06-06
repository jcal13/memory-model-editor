export type PrimitiveType = "none" | "int" | "float" | "str" | "bool";
export type CollectionType = "list" | "tuple" | "set" | "dict";
export type SpecialType = "function";

export type ValueType = PrimitiveType | CollectionType | SpecialType;

export interface PrimitiveKind {
  name: "primitive";
  type: PrimitiveType;
  value: string;
}

type FunctionKind = {
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
  id: number;
  x: number;
  y: number;
  kind: ElementKind;
}
