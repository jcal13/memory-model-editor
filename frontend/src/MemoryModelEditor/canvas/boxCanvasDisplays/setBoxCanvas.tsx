import { CanvasElement } from "../../types";
import MemoryViz from "memory-viz";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openSetInterface: (el: CanvasElement | null) => void;
};

export default function SetBoxCanvas({ element, openSetInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;
    const kind = element.kind;
    if (kind.name !== "set") return;

    const model = new MemoryModel({
      obj_min_width: 150,
      obj_min_height: 105,
      prop_min_width: 50,
      prop_min_height: 40,
      double_rect_sep: 10,
      font_size: 14,
      browser: true,
      roughjs_config: {
        options: {
          fillStyle: "solid",
        },
      },
    });

    model.drawSet(
      5,
      5,
      element.id,
      kind.value, 
      {
        box_container: { fill: "#fdf6e3", fillStyle: "solid" },
        box_id: { fill: "#fff", fillStyle: "solid" },
        box_type: { fill: "#fff", fillStyle: "solid" },
      }
    );

    gRef.current.innerHTML = "";
    gRef.current.appendChild(model.svg);

    const bbox = model.svg.getBBox();
    const padding = 7;
    model.svg.setAttribute("width", `${bbox.width + padding}`);
    model.svg.setAttribute("height", `${bbox.height + padding}`);
    gRef.current.style.width = `${bbox.width + padding}px`;
    gRef.current.style.height = `${bbox.height + padding}px`;
    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - bbox.width / 2}, ${element.y - bbox.height / 2})`
    );
  }, [element]);

  return (
    <g
      ref={gRef}
      onClick={() => openSetInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}

