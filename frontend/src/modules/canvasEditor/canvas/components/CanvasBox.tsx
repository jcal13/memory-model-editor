import React, { useEffect } from "react";
import { BoxProps } from "../utils/BoxProps";
import { useGlobalRefs } from "../hooks/useRef";
import { useDraggableBox } from "../hooks/useEffect";

interface CanvasBoxProps extends BoxProps {
  onSizeChange?: (id: number, size: { w: number; h: number }) => void;
}

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
  onSizeChange,
}: CanvasBoxProps) {
  const { gRef, isDragging, start, origin, halfSize } = useGlobalRefs();

  useDraggableBox({
    gRef,
    element,
    halfSize,
    openInterface,
    isDragging,
    start,
    origin,
    updatePosition,
  });

  useEffect(() => {
    if (!gRef.current || !onSizeChange) return;
    const { width, height } = gRef.current.getBBox();
    onSizeChange(element.boxId as number, { w: width, h: height });
  }, [element, gRef, onSizeChange]);

  return <g ref={gRef} />;
}
