import { group } from "console";
import { CanvasElement } from "../../types";
import MemoryViz from "memory-viz";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openListInterface: (el: CanvasElement | null) => void;
};

export default function ListBoxCanvas({ element, openListInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;
    const kind = element.kind;
    if (kind.name !== "list") return;

    const model = new MemoryModel({
      obj_min_width: 170,
      obj_min_height: 95,
      prop_min_width: 60,
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
      5,
      5,
      "list",
      element.id,
      kind.value, 
      false,
      {
        box_container: { fill: "#fdf6e3", fillStyle: "solid" },
        box_id: { fill: "#fff", fillStyle: "solid" },
        box_type: { fill: "#fff", fillStyle: "solid" },
      }
    );

    // Clear previous SVG and insert updated one
    gRef.current.innerHTML = "";
    gRef.current.appendChild(model.svg);

    const bbox = model.svg.getBBox();
    const padding = 5;
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
      onClick={() => openListInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}
