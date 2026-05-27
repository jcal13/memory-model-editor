export type PrimitiveType = "NoneType" | "int" | "float" | "str" | "bool";
export type CollectionType = "list" | "tuple" | "set" | "dict";
export type SpecialType = "function" | "class";

/**
 * Box type names (used for palette and box configuration lookup)
 */
export type BoxTypeName =
  | "class"
  | "function"
  | "none"
  | "int"
  | "float"
  | "str"
  | "bool"
  | "list"
  | "tuple"
  | "set"
  | "dict"
  | "primitive";

/**
 * Palette tab categories
 */
export type PaletteTab = "all" | "classesFns" | "primitives" | "collections";

/**
 * Box type discriminated union (for canvas elements)
 */
export type BoxType =
  | PrimitiveKind
  | FunctionKind
  | ListKind
  | TupleKind
  | SetKind
  | DictKind
  | ClassKind;

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

export type ClassKind = {
  name: "class";
  type: "class";
  value: null;
  className: string;
  classVariables: FunctionParams[];
};

export interface CanvasElement {
  boxId: number;
  id: ID;
  x: number;
  y: number;
  kind: BoxType;
  questionFrameRole?: "main";
  invalidated?: boolean;
  errors?: ElementError[]; // Unified error system (validation + feedback)
  color?: string; // Optional color to apply to the element (e.g., for errors, warnings, etc.)
}

// Error types - unified system for validation and feedback errors
export enum ErrorSource {
  VALIDATION = "VALIDATION", // Frontend validation errors
  FEEDBACK = "FEEDBACK", // Backend submission feedback errors
}

export enum ErrorType {
  // Validation errors (frontend)
  DANGLING_REFERENCE = "DANGLING_REFERENCE",
  INVALID_ID = "INVALID_ID",

  // Feedback errors (backend)
  TYPE_MISMATCH = "TYPE_MISMATCH",
  VALUE_MISMATCH = "VALUE_MISMATCH",
  MISSING_ELEMENT = "MISSING_ELEMENT",
  UNEXPECTED_ELEMENT = "UNEXPECTED_ELEMENT",
  DUPLICATE_ID = "DUPLICATE_ID",
  ORPHANED_ELEMENT = "ORPHANED_ELEMENT",
  FRAME_MISMATCH = "FRAME_MISMATCH",
  CALL_STACK_ORDER = "CALL_STACK_ORDER",
  PROPERTY_MISMATCH = "PROPERTY_MISMATCH",
  GENERIC_ERROR = "GENERIC_ERROR",
  INVALID_REFERENCE = "INVALID_REFERENCE",
  UNREACHABLE_OBJECT = "UNREACHABLE_OBJECT",
}

export interface ElementError {
  source: ErrorSource;
  type: ErrorType;
  message: string;
  title?: string;
  field?: string; // e.g., "value[0]", "params[1]", "classVariables[2]"
  invalidId?: number; // The specific ID that is invalid
  relatedElementIds?: (number | "_")[]; // All element IDs involved in this error (for multi-element highlighting)
  severity?: "error" | "warning" | "info"; // Optional severity level
}

// Backend feedback error format
export interface FeedbackError {
  type: ErrorType;
  message: string;
  title?: string;
  elementId?: number | "_"; // ID of the element this error relates to
  field?: string; // Specific field within the element
  relatedIds?: (number | "_")[]; // Other IDs involved in the error
  path?: string; // Path description from backend (e.g., "frame.main > var.x")
  severity?: "error" | "warning" | "info";
}

export interface SubmissionResult {
  correct: boolean;
  errors: FeedbackError[]; // Changed from string[] to structured errors
}

export type ID = number | "_";
export type ClassID = string | "_";

export interface BoxEditorType {
  metadata: {
    id: ID;
    kind: BoxType;
    className?: ClassID;
    errors?: ElementError[]; // Updated to use unified error system
    invalidated?: boolean;
  };
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
  canManageClasses?: boolean;
  canManageFunctions?: boolean;
  elements?: any[];
  questionFunctionNames?: string[];
  isLockedMainFrame?: boolean;
  reservedFunctionNames?: string[];
  isQuestionMode?: boolean;
}

export type Tab = "feedback" | "question";
