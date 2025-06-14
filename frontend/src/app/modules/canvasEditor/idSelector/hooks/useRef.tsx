import { useRef } from "react";

/** Mirrors useCanvasRefs but just for the draggable ID-panel */
export const usePanelRefs = () => {
  const dragRef = useRef<HTMLDivElement | null>(null);
  return { dragRef };
};
