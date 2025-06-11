import { CanvasElement } from "../../shared/types";

/* =======================================
   === Props for CanvasBox Component ===
======================================= */

export type BoxProps = {
  /** The memory model element to render and manage */
  element: CanvasElement;

  /** Callback to open an interface (e.g., editor) for the given element */
  openInterface: (el: CanvasElement | null) => void;

  /** Callback to update the element’s position on the canvas */
  updatePosition: (x: number, y: number) => void;
};
