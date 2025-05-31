import React, { useEffect, useRef } from "react";
import MemoryViz from "memory-viz";

export default function FunctionBox() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/box-type", "function");
    e.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    const { MemoryModel } = MemoryViz;
    const model = new MemoryModel({
      obj_min_width: 190,
      obj_min_height: 90,
      prop_min_width: 50,
      prop_min_height: 40,
      double_rect_sep: 10,
      font_size: 18,
      browser: true,
      roughjs_config: {
        options: {
          fillStyle: "solid",
        },
      },
    });

    model.drawClass(5, 5, "__main__", 0, {}, true, {
      box_container: { fill: "#fdf6e3", fillStyle: "solid" },
      box_id: { fill: "#fff", fillStyle: "solid" },
      box_type: { fill: "#fff", fillStyle: "solid" },
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(model.svg);

      const bbox = model.svg.getBBox();
      const padding = 5;
      model.svg.setAttribute("width", `${bbox.width + padding}`);
      model.svg.setAttribute("height", `${bbox.height + padding}`);
      containerRef.current.style.width = `${bbox.width + padding}px`;
      containerRef.current.style.height = `${bbox.height + padding}px`;
    }
  }, []);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      ref={containerRef}
      style={{
        cursor: "grab",
      }}
    ></div>
  );
}
