import { BoxProps } from "./BoxProps";
import { useGlobalRefs } from "./hooks/useRef";
import { useDraggable } from "./hooks/useEffect";

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
}: BoxProps) {
  const { gRef, isDragging, start, origin, halfSize } = useGlobalRefs();

  useDraggable(
    gRef,
    element,
    halfSize,
    openInterface,
    isDragging,
    start,
    origin,
    updatePosition
  );

  return <g ref={gRef} />;
}
