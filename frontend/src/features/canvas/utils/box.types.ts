import {
  CanvasElement,
  ID,
  RenderMode,
  VisualStyle,
} from "../../shared/types";

/**
 * Core props for the CanvasBox component
 */
export interface CanvasBoxProps {
  /** The memory model element to render and manage */
  element: CanvasElement;

  /** Callback to open an interface (e.g., editor) for the given element */
  openInterface: (element: CanvasElement | null) => void;

  /** Callback to update the element's position on the canvas */
  updatePosition: (x: number, y: number) => void;

  /** Callback when box size changes */
  onSizeChange?: (id: number, size: BoxDimensions) => void;

  /** Whether this element has been invalidated */
  invalidated?: boolean;

  /** Whether to disable drag functionality for this box */
  disableDrag?: boolean;

  /** Actual rendered width of the call stack (x + columnWidth), used for constraints */
  callStackWidth?: number;

  /** Active visual style for rendering */
  visualStyle?: VisualStyle;

  /** Lookup map for resolving ID references in alternate renderers */
  elementsById?: Map<number, CanvasElement>;

  /** Renderer mode for size/layout differences */
  renderMode?: RenderMode;
}

/**
 * State for managing drag operations
 */
export interface DragState {
  isDragging: boolean;
  startPoint: { x: number; y: number };
  originalPosition: { x: number; y: number };
}

/**
 * Box dimension measurements
 */
export interface BoxDimensions {
  width: number;
  height: number;
}

/**
 * Configuration for a box type renderer
 */
export interface BoxTypeConfig {
  /** Renders the box using MemoryViz model */
  draw: (model: any, kind: any, id: ID) => void;

  /** Returns the height for this box type */
  getHeight: (kind?: any) => number;

  /** Returns the minimum width for this box type */
  getMinWidth: () => number;
}

/**
 * MemoryViz configuration options
 */
export interface MemoryVizConfig {
  obj_min_width: number;
  obj_min_height: number;
  prop_min_width: number;
  prop_min_height: number;
  double_rect_sep: number;
  font_size: number;
  browser: boolean;
  roughjs_config: {
    options: {
      fillStyle: string;
      seed?: number; // Add optional seed property for consistent rendering
    };
  };
}
