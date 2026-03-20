/**
 * SVG rendering functions for canvas memory model boxes.
 * Generates MemoryViz-based visualizations with error styling support.
 */

import MemoryViz from "memory-viz";
import { CanvasElement, RenderMode, VisualStyle } from "../../shared/types";
import { MemoryVizConfig } from "./box.types";
import {
  getBoxConfig,
  DEFAULT_CANVAS_STYLE,
} from "../../shared/boxConfig";
import { createPythonTutorBoxRenderer } from "./pythonTutorRenderer";

/**
 * Base MemoryViz configuration for all canvas boxes.
 * Defines property sizes, spacing, and styling defaults.
 */
const DEFAULT_MEMORY_VIZ_CONFIG: Partial<MemoryVizConfig> = {
  prop_min_width: 54,
  prop_min_height: 36,
  double_rect_sep: 10,
  font_size: 17,
  browser: true,
  roughjs_config: {
    options: {
      fillStyle: "solid",
      seed: 1,
    },
  },
};

/**
 * Renders a canvas element as an SVG using MemoryViz.
 * Applies element-specific configuration and optional error styling.
 *
 * @param element - Canvas element containing kind, id, and styling data
 * @returns SVG element ready for insertion into the DOM
 *
 * @example
 * const svg = createBoxRenderer(element);
 * container.appendChild(svg);
 */
export function createBoxRenderer(
  element: CanvasElement,
  options: {
    visualStyle?: VisualStyle;
    pythonTutorReferenceArrows?: boolean;
    pythonTutorStandalonePrimitives?: boolean;
    elementsById?: Map<number, CanvasElement>;
    renderMode?: RenderMode;
  } = {}
): SVGSVGElement {
  if (options.visualStyle === "pythonTutor") {
    const svg = createPythonTutorBoxRenderer(element, {
      elementsById: options.elementsById,
      renderMode: options.renderMode,
      showReferenceArrows:
        options.renderMode === "canvas" && options.pythonTutorReferenceArrows,
      showPrimitiveReferencesAsObjects:
        options.pythonTutorStandalonePrimitives,
    });

    if (element.color) {
      applyErrorStyling(svg, element.color);
    }

    return svg;
  }

  const { MemoryModel } = MemoryViz;
  const { kind, id, boxId } = element;
  const kindName = kind.name;

  const boxConfig = getBoxConfig(kindName);

  const memoryVizConfig: MemoryVizConfig = {
    ...DEFAULT_MEMORY_VIZ_CONFIG,
    obj_min_width: boxConfig.getMinWidth(),
    obj_min_height: boxConfig.getHeight(kind),
    roughjs_config: {
      options: {
        fillStyle: "solid",
        seed: boxId || 1,
      },
    },
  } as MemoryVizConfig;

  const model = new MemoryModel(memoryVizConfig);

  boxConfig.drawCanvas(model, kind, id, DEFAULT_CANVAS_STYLE);

  if (element.color) {
    applyErrorStyling(model.svg, element.color);
  }

  return model.svg;
}

/**
 * Applies error styling to an SVG element by modifying stroke, fill, and text colors.
 * Creates a visual error state with lightened fills and colored strokes.
 *
 * @param svg - SVG element to style
 * @param customColor - Optional hex color (defaults to red #DC2626)
 */
function applyErrorStyling(svg: SVGSVGElement, customColor?: string): void {
  const errorColor = customColor || "#DC2626";

  const strokeColor = errorColor;
  const fillColor = lightenColor(errorColor, 0.9);
  const textColor = darkenColor(errorColor, 0.3);

  const shapes = svg.querySelectorAll<SVGElement>(
    "path, rect, circle, ellipse, line, polyline, polygon"
  );
  shapes.forEach((shape) => {
    if (shape.closest("defs")) return;

    shape.style.setProperty("stroke", strokeColor, "important");
    shape.style.setProperty("stroke-width", "2", "important");

    if (shape.tagName === "rect" || shape.classList.contains("container")) {
      shape.style.setProperty("fill", fillColor, "important");
    }
  });

  const textElements = svg.querySelectorAll<SVGElement>("text, tspan");
  textElements.forEach((text) => {
    text.style.setProperty("fill", textColor, "important");
  });
}

/**
 * Lightens a hex color by blending it with white.
 *
 * @param color - Hex color string (e.g., "#FF0000")
 * @param amount - Lightening factor from 0 (no change) to 1 (pure white)
 * @returns Lightened hex color string
 */
function lightenColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * Darkens a hex color by blending it with black.
 *
 * @param color - Hex color string (e.g., "#FF0000")
 * @param amount - Darkening factor from 0 (no change) to 1 (pure black)
 * @returns Darkened hex color string
 */
function darkenColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * Retrieves the dimensions for a canvas element based on its box type.
 *
 * @param element - Canvas element to measure
 * @returns Object with width and height in SVG units
 */
export function getBoxDimensions(element: CanvasElement): {
  width: number;
  height: number;
} {
  const kindName = element.kind.name;
  const boxConfig = getBoxConfig(kindName);

  return {
    width: boxConfig.getMinWidth(),
    height: boxConfig.getHeight(element.kind),
  };
}
