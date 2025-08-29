import MemoryViz from "memory-viz";
import { CanvasElement } from "../../shared/types";
import { BOX_CONFIGS } from "./box.configs";
import { MemoryVizConfig } from "./box.types";
import { DEFAULT_DIMENSIONS } from "./box.helpers";

/**
 * Default MemoryViz configuration
 */
const DEFAULT_MEMORY_VIZ_CONFIG: Partial<MemoryVizConfig> = {
  prop_min_width: 60,
  prop_min_height: 40,
  double_rect_sep: 10,
  font_size: 18,
  browser: true,
  roughjs_config: {
    options: {
      fillStyle: "solid",
    },
  },
};

/**
 * Creates an SVG renderer for a memory model element
 *
 * @param element - The canvas element to render
 * @returns SVG element representing the memory model box
 */
export function createBoxRenderer(element: CanvasElement): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const { kind, id } = element;
  const kindName = kind.name;

  // Get the configuration for this box type
  const boxConfig = BOX_CONFIGS[kindName];

  if (!boxConfig) {
    throw new Error(`Unsupported box type: ${kindName}`);
  }

  // Build MemoryViz configuration
  const memoryVizConfig: MemoryVizConfig = {
    ...DEFAULT_MEMORY_VIZ_CONFIG,
    obj_min_width: boxConfig.getMinWidth(),
    obj_min_height: boxConfig.getHeight(kind),
  } as MemoryVizConfig;

  // Create the MemoryViz model
  const model = new MemoryModel(memoryVizConfig);

  // Draw the element
  boxConfig.draw(model, kind, id);

  // Return the generated SVG
  return model.svg;
}

/**
 * Gets the dimensions for a box type
 *
 * @param element - The canvas element
 * @returns Object containing width and height
 */
export function getBoxDimensions(element: CanvasElement): {
  width: number;
  height: number;
} {
  const kindName = element.kind.name;
  const boxConfig = BOX_CONFIGS[kindName];

  if (!boxConfig) {
    return {
      width: DEFAULT_DIMENSIONS.STANDARD_WIDTH,
      height: DEFAULT_DIMENSIONS.MIN_HEIGHT,
    };
  }

  return {
    width: boxConfig.getMinWidth(),
    height: boxConfig.getHeight(element.kind),
  };
}

/**
 * Checks if a box type is supported
 *
 * @param typeName - The name of the box type
 * @returns True if the type is supported
 */
export function isBoxTypeSupported(typeName: string): boolean {
  return typeName in BOX_CONFIGS;
}
