import { useEffect } from "react";
import { useBoxDragState, useDraggableBox } from "../hooks/useCanvas";
import { CanvasBoxProps } from "../utils/box.types";

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
  onSizeChange,
  invalidated = false,
  disableDrag = false,
  callStackWidth,
}: CanvasBoxProps) {
  const { gRef, dragState, dimensions } = useBoxDragState();

  useDraggableBox({
    gRef,
    element,
    dimensions,
    dragState,
    openInterface,
    updatePosition,
    invalidated,
    disableDrag,
    callStackWidth,
  });

  // Report size changes for parent components (like CallStack)
  useEffect(() => {
    if (!onSizeChange || !gRef.current) return;

    const { width, height } = dimensions.current;
    if (width > 0 && height > 0) {
      onSizeChange(element.boxId as number, { width, height });
    }
  }, [element, onSizeChange, dimensions]);

  return <g ref={gRef} />;
}
