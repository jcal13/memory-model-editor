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
  boxId: number;
  id: ID;
  x: number;
  y: number;
  kind: BoxType;
}

export type SubmissionResult = { correct: boolean; errors: string[] } | null;

export type ID = number | "_";
export type ClassID = string | "_";


export interface BoxEditorType {
  metadata: { id: ID; kind: BoxType; className?: ClassID };
  onSave: (id: ID, kind: BoxType) => void;
  onRemove: () => void;
  onClose: () => void;

  ids: ID[];
  addId: (id: ID) => void;
  removeId: (id: ID) => void;

  classes?: string[]; // List of all class names
  addClasses?: (className: string) => void;
  removeClasses?: (className: string) => void;
  
  sandbox?: boolean;


}

export type Tab = "feedback" | "question";
