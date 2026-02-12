import { useRef } from "react";
import { usePaletteBoxEffect } from "../hooks/usePalette";
import { BoxTypeName } from "../../shared/types";

interface PaletteBoxProps {
  /** The type of box to render (e.g., "primitive", "list", "dict") */
  boxType: BoxTypeName;
}

/**
 * PaletteBox renders a draggable representation of a memory model box
 * in the palette sidebar. It automatically renders the correct SVG
 * preview using `usePaletteBoxEffect`, and supports drag-and-drop to
 * create a new box on the canvas.
 */
export default function PaletteBox({ boxType }: PaletteBoxProps) {
  /** Ref to the div container that will hold the rendered SVG */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Custom hook to render the box preview inside the container */
  usePaletteBoxEffect(containerRef, boxType);

  /** Drag-and-drop: set box type on drag start */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("application/box-type", boxType);
    event.dataTransfer.effectAllowed = "move";
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  /** Drag-and-drop: re-enable text selection when drag ends */
  const handleDragEnd = () => {
    // Re-enable text selection after drag
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      ref={containerRef}
      style={{
        cursor: "grab",
        overflow: "visible",
        display: "inline-block",
        userSelect: "none", // Prevent selection on the element itself
      }}
      role="button"
      tabIndex={0}
      aria-label={`Draggable ${boxType} box`}
    />
  );
}
