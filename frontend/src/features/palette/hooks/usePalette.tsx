/**
 * Custom hooks for palette functionality.
 * Handles rendering preview SVGs for draggable palette items.
 */

import { useEffect, RefObject } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";
import { BoxTypeName } from "../../shared/types";

/**
 * Renders a static preview SVG for a palette box type.
 * Automatically updates when the box type changes and adjusts container size.
 *
 * @param containerRef - Reference to the container div that will hold the SVG
 * @param boxType - Type of box to render (e.g., "primitive", "list", "dict")
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * usePaletteBoxEffect(containerRef, "function");
 * // Renders a function box preview in the container
 */
export const usePaletteBoxEffect = (
  containerRef: RefObject<HTMLDivElement | null>,
  boxType: BoxTypeName
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const svg = createBoxRenderer(boxType);

      container.innerHTML = "";
      container.appendChild(svg);

      const padding = 5;
      const bbox = svg.getBBox();
      container.style.width = `${bbox.width + padding}px`;
      container.style.height = `${bbox.height + padding}px`;
    } catch (error) {
      console.error(`Failed to render box type ${boxType}:`, error);
    }
  }, [boxType, containerRef]);
};
