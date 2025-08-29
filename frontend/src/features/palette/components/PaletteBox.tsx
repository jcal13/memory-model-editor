import { useRef } from "react";
import { BoxConfigs } from "../utils/BoxConfigs";
import { usePaletteBoxEffect } from "../hooks/useEffect";

interface Props {
  /** The type of box to render (e.g., "primitive", "list", "dict") */
  boxType: keyof typeof BoxConfigs;
}

/**
 * PaletteBox renders a draggable representation of a memory model box
 * in the palette sidebar. It automatically renders the correct SVG
 * preview using `usePaletteBoxEffect`, and supports drag-and-drop to
 * create a new box on the canvas.
 */
export default function PaletteBox({ boxType }: Props) {
  /* === Ref to the div container that will hold the rendered SVG === */
  const containerRef = useRef<HTMLDivElement>(null);

  /* === Custom hook to render the box preview inside the container === */
  usePaletteBoxEffect(containerRef, boxType);

  /* === Drag-and-drop: set box type on drag start === */
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
