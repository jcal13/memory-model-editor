import { useRef } from "react";

export const useGlobalRefs = () => {
  const gRef = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const halfSize = useRef({ w: 0, h: 0 });
  return { gRef, isDragging, start, origin, halfSize };
};
