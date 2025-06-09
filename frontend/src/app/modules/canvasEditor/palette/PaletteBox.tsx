import { useEffect, useRef } from "react";
import { BoxConfigs } from "./BoxConfigs";
import { createBoxRenderer } from "./BoxRenderer";

interface Props {
  boxType: keyof typeof BoxConfigs;
}

export default function PaletteBox({ boxType }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = createBoxRenderer(boxType);
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(svg);
      
      const padding = 5;  
      const bbox = svg.getBBox();
      containerRef.current.style.width = `${bbox.width + padding}px`;
      containerRef.current.style.height = `${bbox.height + padding}px`;
    }
  }, [boxType]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/box-type", boxType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      ref={containerRef}
      style={{
        cursor: "grab",
        overflow: "visible",
        display: "inline-block",
      }}
    />
  );
}
