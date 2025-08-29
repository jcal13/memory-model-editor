import { useEffect } from "react";
import { BoxProps } from "../utils/BoxProps";
import { useDraggableBox, useBoxDragState } from "../hooks/hooks";

interface CanvasBoxProps extends BoxProps {
  onSizeChange?: (id: number, size: { w: number; h: number }) => void;
}

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
  onSizeChange,
  invalidated = false,
}: CanvasBoxProps) {
  const { gRef, isDragging, start, origin, halfSize } = useBoxDragState();
  useDraggableBox({
    gRef,
    element,
    halfSize,
    openInterface,
    isDragging,
    start,
    origin,
    updatePosition,
    invalidated,
  });

  useEffect(() => {
    if (!gRef.current || !onSizeChange) return;
    const { width, height } = gRef.current.getBBox();
    onSizeChange(element.boxId as number, { w: width, h: height });
  }, [element, gRef, onSizeChange]);

  return <g ref={gRef} />;
}
