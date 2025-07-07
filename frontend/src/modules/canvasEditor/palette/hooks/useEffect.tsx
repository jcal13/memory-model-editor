import { useEffect } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";

/**
 * usePaletteBoxEffect renders a preview SVG for a given boxType
 * inside a DOM container. This is used to show draggable items in the palette.
 *
 * @param containerRef - A ref to the div container where the SVG will be inserted
 * @param boxType - The type of memory element (e.g., "primitive", "list", etc.)
 */
export const usePaletteBoxEffect = (containerRef: any, boxType: any) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
  }, [boxType, containerRef]);
};
