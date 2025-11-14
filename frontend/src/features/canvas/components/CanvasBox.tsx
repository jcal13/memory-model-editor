import { useEffect, useCallback, useState } from "react";
import { useBoxDragState, useDraggableBox } from "../hooks/hooks";
import { CanvasBoxProps } from "../utils/box.types";
import { 
  getCallStackBounds, 
  constrainPositionAwayFromCallStack 
} from "../utils/boundary.helpers";
import { hasErrors } from "../utils/validation";
import ValidationTooltip from "./ValidationTooltip";

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
  onSizeChange,
  invalidated = false,
  disableDrag = false,
}: CanvasBoxProps) {
  const { gRef, dragState, dimensions } = useBoxDragState();
  const [isHovered, setIsHovered] = useState(false);

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
    const canvasBounds = vb ? { width: vb.width, height: vb.height } : undefined;
    const callStackBounds = getCallStackBounds(vb?.height || window.innerHeight);

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

  useEffect(() => {
    checkAndConstrainPosition();
  }, [checkAndConstrainPosition]);

  // Window resize effect: re-constrain position when window size changes
  useEffect(() => {
    if (disableDrag || element.kind.name === "function") return;

    let resizeTimeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce the resize handling to avoid excessive recalculations
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        checkAndConstrainPosition();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeoutId);
    };
  }, [checkAndConstrainPosition, disableDrag, element.kind.name]);

  // Hover handlers for validation tooltip
  useEffect(() => {
    const gElement = gRef.current;
    if (!gElement) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    gElement.addEventListener("mouseenter", handleMouseEnter);
    gElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      gElement.removeEventListener("mouseenter", handleMouseEnter);
      gElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [gRef]);

  const showTooltip = isHovered && hasErrors(element);

  return (
    <>
      <g ref={gRef} />
      {showTooltip && (
        <foreignObject
          x={element.x}
          y={element.y - 10}
          width="1"
          height="1"
          overflow="visible"
          pointerEvents="none"
          style={{ zIndex: 10000 }}
        >
          <ValidationTooltip
            errors={element.errors || []}
            visible={showTooltip}
          />
        </foreignObject>
      )}
    </>
  );
}
