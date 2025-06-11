import { useRef } from "react";

// Refs for positioning and dragging CanvasBoxes
export const useGlobalRefs = () => {
  const gRef = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const halfSize = useRef({ w: 0, h: 0 });

  return { gRef, isDragging, start, origin, halfSize };
};

// Refs for the Canvas SVG and drag overlay (e.g., BoxEditor modal)
export const useCanvasRefs = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  return { svgRef, dragRef };
};
