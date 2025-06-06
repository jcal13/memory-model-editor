import React, { useEffect, useRef } from "react";
import MemoryViz from "memory-viz";
import { CanvasElement } from "../../types";

type Props = {
  element: CanvasElement;
  openFunctionInterface: (el: CanvasElement | null) => void;
};

export default function FunctionBoxCanvas({ element, openFunctionInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const { MemoryModel } = MemoryViz;

    const kind = element.kind;
    if (kind.name !== "function") return;

    const model = new MemoryModel({
      obj_min_width: 150,
      obj_min_height: 70,
      prop_min_width: 30,
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

    // Build props: paramName -> targetId or null
    const props: Record<string, number | null> = {};
    kind.params.forEach((p) => {
      props[p.name] = p.targetId;
    });

    model.drawClass(
      5,
      5,
      `${kind.functionName}`,
      element.id,
      props,
      true,
      {
        box_container: { fill: "#fdf6e3", fillStyle: "solid" },
        box_id: { fill: "#fff", fillStyle: "solid" },
        box_type: { fill: "#fff", fillStyle: "solid" },
      }
    );

    // Clear and insert new SVG
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
      onClick={() => openFunctionInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}

