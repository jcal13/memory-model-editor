import MemoryViz from "memory-viz";
import { CanvasElement } from "../../shared/types";
import { BOX_CONFIGS } from "./box.configs";
import { MemoryVizConfig } from "./box.types";
import { DEFAULT_DIMENSIONS } from "./box.helpers";
import { hasErrors } from "./validation";

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
      seed: 1, // Default seed for consistent rendering
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
  const { kind, id, boxId } = element;
  const kindName = kind.name;

  // Get the configuration for this box type
  const boxConfig = BOX_CONFIGS[kindName];

  if (!boxConfig) {
    throw new Error(`Unsupported box type: ${kindName}`);
  }

  // Determine if element has errors (validation or feedback)
  const elementHasErrors = hasErrors(element);

  // Build MemoryViz configuration with element-specific seed
  const memoryVizConfig: MemoryVizConfig = {
    ...DEFAULT_MEMORY_VIZ_CONFIG,
    obj_min_width: boxConfig.getMinWidth(),
    obj_min_height: boxConfig.getHeight(kind),
    roughjs_config: {
      options: {
        fillStyle: "solid",
        seed: boxId || 1, // Use boxId as seed for consistent rendering per element
      },
    },
  } as MemoryVizConfig;

  // Create the MemoryViz model
  const model = new MemoryModel(memoryVizConfig);

  // Draw the element using the standard method
  boxConfig.draw(model, kind, id);

  // Apply error styling to the SVG if errors exist
  if (elementHasErrors) {
    applyErrorStyling(model.svg, element.color);
  }

  // Return the generated SVG
  return model.svg;
}

/**
 * Applies error styling to a rendered SVG element
 * @param svg - The SVG element to style
 * @param customColor - Optional custom color to use instead of default red
 */
function applyErrorStyling(svg: SVGSVGElement, customColor?: string): void {
  // Default colors (subtle reddish-gray tint)
  const DEFAULT_ERROR_STROKE = "#D97676"; // Muted red-gray for stroke
  const DEFAULT_ERROR_FILL = "#F5E5E5"; // Very light reddish tint for fill
  const DEFAULT_ERROR_TEXT = "#A85858"; // Muted red-brown for text
  
  // Use custom color if provided, otherwise use defaults
  let strokeColor: string;
  let fillColor: string;
  let textColor: string;
  
  if (customColor) {
    // If custom color provided, use it for stroke and derive lighter shades
    strokeColor = customColor;
    fillColor = lightenColor(customColor, 0.9); // Very light tint
    textColor = darkenColor(customColor, 0.3); // Darker for text
  } else {
    strokeColor = DEFAULT_ERROR_STROKE;
    fillColor = DEFAULT_ERROR_FILL;
    textColor = DEFAULT_ERROR_TEXT;
  }
  
  // Style all rectangles, paths, and shapes (boxes)
  const shapes = svg.querySelectorAll<SVGElement>(
    "rect:not([data-text-bg]), path, polygon"
  );
  shapes.forEach((shape) => {
    // Skip elements inside defs (patterns, etc.)
    if (shape.closest("defs")) return;

    // Apply stroke color
    shape.style.setProperty("stroke", strokeColor, "important");
    shape.style.setProperty("stroke-width", "2", "important");
    
    // Apply fill for container boxes
    if (shape.tagName === "rect" || shape.classList.contains("container")) {
      shape.style.setProperty("fill", fillColor, "important");
    }
  });

  // Apply tint to text
  const textElements = svg.querySelectorAll<SVGElement>("text, tspan");
  textElements.forEach((text) => {
    text.style.setProperty("fill", textColor, "important");
  });
}

/**
 * Lightens a color by mixing it with white
 * @param color - Hex color string (e.g., "#FF0000")
 * @param amount - Amount to lighten (0-1, where 1 is full white)
 * @returns Lightened hex color
 */
function lightenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Darkens a color by mixing it with black
 * @param color - Hex color string (e.g., "#FF0000")
 * @param amount - Amount to darken (0-1, where 1 is full black)
 * @returns Darkened hex color
 */
function darkenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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
