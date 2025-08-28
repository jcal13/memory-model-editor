import { CanvasElement } from "../../shared/types";

export interface CanvasBoxProps {
  element: CanvasElement;
  openInterface: (element: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
  onSizeChange?: (id: number, size: { w: number; h: number }) => void;
  invalidated?: boolean;
}

export interface DragState {
  isDragging: boolean;
  startPoint: { x: number; y: number };
  originalPosition: { x: number; y: number };
}

export interface BoxDimensions {
  width: number;
  height: number;
}
