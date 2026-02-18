/**
 * Box utilities module
 *
 * Provides rendering, configuration, and helper functions
 * for memory model canvas boxes.
 */

// Type exports
export type {
  CanvasBoxProps,
  DragState,
  BoxDimensions,
  BoxTypeConfig,
  MemoryVizConfig,
} from "./box.types";

// Boundary utility type exports
export type {
  CallStackBounds,
  Position,
  ElementDimensions,
} from "./boundary.helpers";

// Configuration exports (now unified in shared/boxConfig)
// BOX_CONFIGS moved to shared/boxConfig for unified canvas + palette rendering

// Helper function exports
export {
  BOX_STYLES,
  DEFAULT_DIMENSIONS,
  extractValues,
  normalizeId,
  makeUniqueKey,
  getSequenceHeight,
  processFunctionParams,
  processClassVariables,
  extractDictionary,
} from "./box.helpers";

// Boundary utility function exports
export {
  DEFAULT_CALLSTACK_BOUNDS,
  getCallStackBounds,
  isElementOverlappingCallStack,
  constrainPositionAwayFromCallStack,
  smoothlyConstrainDragPosition,
  CALLSTACK_PADDING,
} from "./boundary.helpers";

// Renderer exports
export {
  createBoxRenderer,
  getBoxDimensions,
} from "./box.renderer";

// Validation exports
export {
  validateElements,
  hasErrors,
  getErrorSummary,
} from "./validation";
