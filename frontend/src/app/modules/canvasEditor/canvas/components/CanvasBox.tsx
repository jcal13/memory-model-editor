import { BoxProps } from "../utils/BoxProps";
import { useGlobalRefs } from "../hooks/useRef";
import { useDraggableBox } from "../hooks/useEffect";

/**
 * CanvasBox is a draggable SVG group (<g>) element that represents
 * a memory model box on the canvas.
 *
 * It handles drag logic and updates position via provided callbacks.
 *
 * @param element - The box data (type, position, ID, etc.)
 * @param openInterface - Function to open the box editor when interacted with
 * @param updatePosition - Callback to update the box's coordinates on drag
 */
export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
}: BoxProps) {
  // Get refs used to track drag state and bounding box
  const { gRef, isDragging, start, origin, halfSize } = useGlobalRefs();

  // Hook to enable dragging behavior
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

  return <g ref={gRef} />;
}
