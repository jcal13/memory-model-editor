export type PaletteTab = "all" | "classesFns" | "primitives" | "collections";

export type BoxType =
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
  | "dict";

export interface BoxConfig {
  draw: (model: any) => void;
  minHeight: number;
  minWidth: number;
}

export interface BoxStyle {
  box_id: { fill: string; fillStyle: string };
  box_type: { fill: string; fillStyle: string };
}
