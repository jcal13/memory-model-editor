import React, { useEffect, useRef } from "react";
import MemoryViz from "memory-viz";
// import type { MemoryModel } from "memory-viz";

export default function SetBox() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/box-type", "set");
    e.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    const { MemoryModel } = MemoryViz;
    const model = new MemoryModel({
      obj_min_width: 170,
      obj_min_height: 90,
      prop_min_width: 60,
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
    // const model = props.model;

    model.drawSet(10, 10, 0, [], {
      box_container: { fill: "white", fillStyle: "none" },
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(model.svg);
    }
  }, []);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      ref={containerRef}
      style={{
        width: "200px",
        height: "125px",
        cursor: "grab",
        // display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    ></div>
  );
}
