import React, { useEffect, useRef } from "react";
import MemoryViz from "memory-viz";

export default function PrimitiveBox() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { MemoryModel } = MemoryViz;
    const model = new MemoryModel({ browser: true, roughjs_config: {
    options: {
      fillStyle: "solid", // no scribble fill
    },
  } });

    model.drawPrimitive(100, 100, "int", 42, 99, {
      box_container: {fill:"white", fillStyle: "none"},
    });


    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(model.svg);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "500px", height: "300px", border: "1px solid red" }}
    />
  );
}
