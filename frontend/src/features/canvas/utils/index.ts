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

// Configuration exports
export { BOX_CONFIGS } from "./box.configs";

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

// Renderer exports
export {
  createBoxRenderer,
  getBoxDimensions,
  isBoxTypeSupported,
} from "./box.renderer";
