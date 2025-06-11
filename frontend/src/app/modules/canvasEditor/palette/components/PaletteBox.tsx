import { useRef } from "react";
import { BoxConfigs } from "../utils/BoxConfigs";
import { usePaletteBoxEffect } from "../hooks/useEffect";

interface Props {
  boxType: any;
}

export default function PaletteBox({ boxType }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  usePaletteBoxEffect(containerRef, boxType);

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
