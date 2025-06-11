import { BoxProps } from "../utils/BoxProps";
import { useGlobalRefs } from "../hooks/useRef";
import { useDraggableBox } from "../hooks/useEffect";

export default function CanvasBox({
  element,
  openInterface,
  updatePosition,
}: BoxProps) {
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

  return <g ref={gRef} />;
}
