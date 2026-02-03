import { useEffect, useCallback } from "react";
import { useBoxDragState, useDraggableBox } from "../hooks/hooks";
import { CanvasBoxProps } from "../utils/box.types";
import {
  getCallStackBounds,
  constrainPositionAwayFromCallStack,
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
  const checkAndConstrainPosition = useCallback(() => {
    if (disableDrag || !gRef.current) return;

    const { width, height } = dimensions.current;
    if (width <= 0 || height <= 0) return;

    // Skip constraint for function elements (they belong in the callstack)
    if (element.kind.name === "function") return;

    const svg = gRef.current.ownerSVGElement;
    const vb = svg?.viewBox.baseVal;
    const canvasBounds = vb
      ? { width: vb.width, height: vb.height }
      : undefined;
    const callStackBounds = getCallStackBounds(
      vb?.height || window.innerHeight
    );

    const constrainedPosition = constrainPositionAwayFromCallStack(
      { x: element.x, y: element.y },
      { width, height },
      callStackBounds,
      canvasBounds
    );

    // Clamp position to stay within canvas bounds (prevents boxes from being cut off)
    if (canvasBounds && canvasBounds.width > 0 && canvasBounds.height > 0) {
      const halfW = width / 2;
      const halfH = height / 2;
      constrainedPosition.x = Math.max(
        halfW,
        Math.min(canvasBounds.width - halfW, constrainedPosition.x)
      );
      constrainedPosition.y = Math.max(
        halfH,
        Math.min(canvasBounds.height - halfH, constrainedPosition.y)
      );
    }

    // Only update position if it actually changed
    if (
      constrainedPosition.x !== element.x ||
      constrainedPosition.y !== element.y
    ) {
      updatePosition(constrainedPosition.x, constrainedPosition.y);
    }
  }, [
    element.x,
    element.y,
    element.kind.name,
    dimensions.current.width,
    dimensions.current.height,
    disableDrag,
    updatePosition,
  ]);

  useEffect(() => {
    checkAndConstrainPosition();
  }, [checkAndConstrainPosition]);

  // Canvas resize effect: re-constrain position when canvas size changes
  // Uses ResizeObserver on the parent SVG so it fires for both window resizes
  // and panel resizes (e.g. dragging the question tab wider)
  useEffect(() => {
    if (disableDrag || element.kind.name === "function") return;

    const svg = gRef.current?.ownerSVGElement;
    if (!svg) return;

    let resizeTimeoutId: NodeJS.Timeout;

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        checkAndConstrainPosition();
      }, 100);
    });

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeoutId);
    };
  }, [checkAndConstrainPosition, disableDrag, element.kind.name]);

  return <g ref={gRef} />;
}
