import { CanvasElement } from "../../types";
import MemoryViz from "memory-viz";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openListInterface: (el: CanvasElement | null) => void;
};

export default function TupleBoxCanvas({ element, openListInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;
    const kind = element.kind;
    if (kind.name !== "tuple") return;

    const model = new MemoryModel({
      obj_min_width: 170,
      obj_min_height: 95,
      prop_min_width: 50,
      prop_min_height: 30,
      double_rect_sep: 10,
      font_size: 14,
      browser: true,
      roughjs_config: {
        options: {
          fillStyle: "solid",
        },
      },
    });

    model.drawSequence(
      15,
      15,
      "tuple",
      element.id,
      kind.value, 
      false,
      {
      box_id: { fill: "#fff", fillStyle: "solid" },
      box_type: { fill: "#fff", fillStyle: "solid" },
      }
    );

    gRef.current.innerHTML = "";
    gRef.current.appendChild(model.svg);

    const bbox = model.svg.getBBox();
    model.svg.setAttribute("width", `${bbox.width}`);
    model.svg.setAttribute("height", `${bbox.height}`);
    const padding = 5;
    model.svg.setAttribute("width", `${bbox.width + padding}`);
    model.svg.setAttribute("height", `${bbox.height + padding}`);
    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - bbox.width / 2}, ${element.y - bbox.height / 2})`
    );
    gRef.current.style.width = `${bbox.width + padding}px`;
    gRef.current.style.height = `${bbox.height + padding}px`;
  }, [element]);

  return (
    <g
      ref={gRef}
      onClick={() => openListInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}