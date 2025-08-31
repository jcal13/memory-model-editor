import { useEffect, RefObject } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";
import { BoxType } from "../shared/types";

/**
 * usePaletteBoxEffect renders a preview SVG for a given boxType
 * inside a DOM container. This is used to show draggable items in the palette.
 *
 * @param containerRef - A ref to the div container where the SVG will be inserted
 * @param boxType - The type of memory element (e.g., "primitive", "list", etc.)
 */
export const usePaletteBoxEffect = (
  containerRef: RefObject<HTMLDivElement | null>,
  boxType: BoxType
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Generate the SVG for the given boxType
      const svg = createBoxRenderer(boxType);

      // Clear any previous content and insert the new SVG
      container.innerHTML = "";
      container.appendChild(svg);

      // Adjust the container size based on the bounding box of the SVG
      const padding = 5;
      const bbox = svg.getBBox();
      container.style.width = `${bbox.width + padding}px`;
      container.style.height = `${bbox.height + padding}px`;
    } catch (error) {
      console.error(`Failed to render box type ${boxType}:`, error);
    }
  }, [boxType, containerRef]);
};
