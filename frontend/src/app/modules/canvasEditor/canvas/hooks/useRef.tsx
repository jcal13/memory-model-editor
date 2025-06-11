import { useRef } from "react";

/* ============================
 * Refs for CanvasBox Elements
 * ============================
 *
 * Used for tracking dragging logic and position metadata
 * within each draggable <g> SVG group.
 */
export const useGlobalRefs = () => {
  const gRef = useRef<SVGGElement>(null); // <g> element reference
  const isDragging = useRef(false); // whether the box is currently being dragged
  const start = useRef({ x: 0, y: 0 }); // starting mouse position
  const origin = useRef({ x: 0, y: 0 }); // original position of the box
  const halfSize = useRef({ w: 0, h: 0 }); // half width/height of box for bounding

  return { gRef, isDragging, start, origin, halfSize };
};

/* =================================
 * Refs for Canvas View + Drag Layer
 * =================================
 *
 * Used in the canvas component to resize viewBox and track drag overlay positioning.
 */
export const useCanvasRefs = () => {
  const svgRef = useRef<SVGSVGElement | null>(null); // the main <svg> element
  const dragRef = useRef<HTMLDivElement | null>(null); // optional drag overlay div (e.g., box editor modal)

  return { svgRef, dragRef };
};
