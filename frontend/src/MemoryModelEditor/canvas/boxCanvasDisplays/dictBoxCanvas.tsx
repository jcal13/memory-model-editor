import { CanvasElement } from "../../types";
import MemoryViz from "memory-viz";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openDictInterface: (el: CanvasElement | null) => void;
};

export default function DictBoxCanvas({ element, openDictInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;
    const kind = element.kind;
    if (kind.name !== "dict") return;

    const model = new MemoryModel({
      obj_min_width: 150,
      obj_min_height: 200,
      prop_min_width: 40,
      prop_min_height: 30,
      double_rect_sep: 10,
      font_size: 12,
      browser: true,
      roughjs_config: {
        options: {
          fillStyle: "solid",
        },
      },
    });
    
    model.drawDict(
      5,
      5,
      element.id,
      kind.value,
      {
        "text_value" : {"font-style" : "italic"},
        'box_id': {fill: 'white', fillStyle: "dots"}}
    );

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
      onClick={() => openDictInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}