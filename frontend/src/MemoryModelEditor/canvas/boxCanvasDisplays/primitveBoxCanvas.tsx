import { CanvasElement } from "../../types";
import MemoryViz from "memory-viz";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openPrimitiveInterface: (el: CanvasElement | null) => void;
};

export default function PrimitiveBoxCanvas({ element, openPrimitiveInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;
    const kind = element.kind;
    if (kind.name !== "primitive") return;

    const model = new MemoryModel({
      obj_min_width: 150,
      obj_min_height: 67.5,
      prop_min_width: 37.5,
      prop_min_height: 25,
      double_rect_sep: 10,
      font_size: 14,
      browser: true,
      roughjs_config: {
        options: {
          fillStyle: "solid",
        },
      },
    });

    model.drawPrimitive(
      15,
      15,
      kind.type,
      element.id,
      kind.value,
      {
        box_id: { fill: "#fff", fillStyle: "solid" },
        box_type: { fill: "#fff", fillStyle: "solid" },
        text_value: { fill: "#000" },
      }
    );
    if(gRef.current)
    {
    gRef.current.innerHTML = "";
    gRef.current.appendChild(model.svg);

    const bbox = model.svg.getBBox();
    const padding = 15;
    model.svg.setAttribute("width", `${bbox.width + padding}`);
    model.svg.setAttribute("height", `${bbox.height + padding}`);
    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - bbox.width / 2}, ${element.y - bbox.height / 2})`
    );
    gRef.current.style.width = `${bbox.width + padding}px`;
    gRef.current.style.height = `${bbox.height + padding}px`;
    }

  }, [element]);

  return (
    <g
      ref={gRef}
      onClick={() => openPrimitiveInterface(element)}
      style={{
        cursor: "pointer",
        overflow: "visible",
        display: "inline-block",
      }}    />
  );
}