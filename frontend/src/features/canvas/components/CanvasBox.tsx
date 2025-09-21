import { useEffect } from "react";
import { useBoxDragState, useDraggableBox } from "../hooks/hooks";
import { CanvasBoxProps } from "../utils/box.types";
import { 
  getCallStackBounds, 
  constrainPositionAwayFromCallStack 
} from "../utils/boundary.helpers";

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
  onSizeChange,
  invalidated = false,
  disableDrag = false,
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
  });

  // Report size changes for parent components (like CallStack)
  useEffect(() => {
    if (!onSizeChange || !gRef.current) return;

    const { width, height } = dimensions.current;
    if (width > 0 && height > 0) {
      onSizeChange(element.boxId as number, { width, height });
    }
  }, [element, onSizeChange, dimensions]);

  // Auto-constraint effect: automatically move boxes away from callstack after render
  useEffect(() => {
    if (disableDrag || !gRef.current) return;

    const { width, height } = dimensions.current;
    if (width <= 0 || height <= 0) return;

    // Skip constraint for function elements (they belong in the callstack)
    if (element.kind.name === "function") return;

    const callStackBounds = getCallStackBounds(window.innerHeight);
    const svg = gRef.current.ownerSVGElement;
    const vb = svg?.viewBox.baseVal;
    const canvasBounds = vb ? { width: vb.width, height: vb.height } : undefined;

    const constrainedPosition = constrainPositionAwayFromCallStack(
      { x: element.x, y: element.y },
      { width, height },
      callStackBounds,
      canvasBounds
    );

    // Only update position if it actually changed
    if (constrainedPosition.x !== element.x || constrainedPosition.y !== element.y) {
      updatePosition(constrainedPosition.x, constrainedPosition.y);
    }
  }, [element.x, element.y, element.kind.name, dimensions.current.width, dimensions.current.height, disableDrag, updatePosition]);

  return <g ref={gRef} />;
}
