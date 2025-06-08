import { CanvasElement } from "../../types";

export type BoxProps = {
  element: CanvasElement;
  openInterface: (el: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
};
