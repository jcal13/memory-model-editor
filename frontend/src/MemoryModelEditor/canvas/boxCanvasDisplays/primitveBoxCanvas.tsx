import { useEffect, useRef } from "react";
import { CanvasElement } from "../../types";
import MemoryModel from "memory-viz";

type Props = {
  element: CanvasElement;
  openPrimitiveInterface: (el: CanvasElement | null) => void;
  beginDrag: (id: number) => void;
};

export default function PrimitiveBoxCanvas({
  element,
  openPrimitiveInterface,
  beginDrag,
}: Props) {
  const { x, y, id, kind } = element;

  const w = 100;
  const h = 100;

  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const host = gRef.current;
    if (!host) return;

    const entity = { type: kind.type, id, value: kind.value };

    const model = new MemoryModel.MemoryModel({
      browser: true,
    });

    model.drawObject(0, 0, "string", 1, "hello", true, {});
    host.append(model.svg);
  }, [id, kind.type, kind.value, w, h]);

  return (
    <g
      ref={gRef}
      transform={`translate(${x - w / 2}, ${y - h / 2})`}
      cursor="pointer"
      onMouseDown={() => beginDrag(id)}
      onDoubleClick={() => openPrimitiveInterface(element)}
    />
  );
}
