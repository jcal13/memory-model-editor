export type PrimitiveType = "None" | "int" | "float" | "str" | "bool";
export type CollectionType = "list" | "tuple" | "set" | "dict";
export type SpecialType = "function";
export type BoxType =
  | PrimitiveKind
  | FunctionKind
  | ListKind
  | TupleKind
  | SetKind
  | DictKind;

export type ValueType = PrimitiveType | CollectionType | SpecialType;

export type FunctionParams = { name: string; targetId: number | null };

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
  params: FunctionParams[];
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

export interface CanvasElement {
  id: number | string;
  x: number;
  y: number;
  kind: BoxType;
}

export interface BoxEditorType {
  metadata: { id: string; kind: BoxType };
  onSave: (kind: BoxType) => void;
  onRemove: () => void;
}
