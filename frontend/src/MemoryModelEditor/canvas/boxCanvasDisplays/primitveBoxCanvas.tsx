import { CanvasElement } from "../../types";
import { MemoryModel } from "memory-viz";
import { drawPrimitive } from "memory-viz/memory_model";

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

  const w = 80;
  const h = 40;
  const halfW = w / 2;
  const halfH = h / 2;

  return (
    <g
      cursor="pointer"
      onMouseDown={() => beginDrag(id)}
      onDoubleClick={() => openPrimitiveInterface(element)}
    >
      <rect
        x={x - halfW}
        y={y - halfH}
        width={w}
        height={h}
        stroke="#333"
        fill="transparent"
      />

      <line x1={x - halfW} y1={y} x2={x + halfW} y2={y} stroke="#333" />

      <line x1={x} y1={y - halfH} x2={x} y2={y} stroke="#333" />

      <rect
        x={x - halfW}
        y={y - halfH}
        width={halfW}
        height={halfH}
        fill="#d9d9d9"
        stroke="none"
      />

      <rect
        x={x - halfW}
        y={y}
        width={w}
        height={halfH}
        fill="#d9d9d9"
        stroke="none"
      />

      <text
        x={x - halfW / 2}
        y={y - halfH / 2 + 4}
        fontSize="10"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {id}
      </text>

      <text
        x={x + halfW / 2}
        y={y - halfH / 2 + 4}
        fontSize="10"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {kind.type}
      </text>

      <text
        x={x}
        y={y + halfH / 2 + 2}
        fontSize="12"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {kind.value}
      </text>
    </g>
  );
}
