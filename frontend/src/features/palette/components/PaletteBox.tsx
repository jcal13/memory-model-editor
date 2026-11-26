import React, { useRef } from "react";
import { usePaletteBoxEffect } from "../hooks/usePalette";
import { BoxTypeName, VisualStyle } from "../../shared/types";

interface PaletteBoxProps {
  /** The type of box to render (e.g., "primitive", "list", "dict") */
  boxType: BoxTypeName;
  visualStyle: VisualStyle;
  /** Keyboard alternative to dragging: Enter / Space adds the box. */
  onActivate?: (boxType: BoxTypeName) => void;
}

const SPOKEN_NAMES: Partial<Record<BoxTypeName, string>> = {
  function: "frame",
  class: "object (class)",
  none: "None",
};

/**
 * PaletteBox renders a draggable representation of a memory model box
 * in the palette sidebar. It automatically renders the correct SVG
 * preview using `usePaletteBoxEffect`, and supports drag-and-drop to
 * create a new box on the canvas.
 */
export default function PaletteBox({ boxType, visualStyle, onActivate }: PaletteBoxProps) {
  /** Ref to the div container that will hold the rendered SVG */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Custom hook to render the box preview inside the container */
  usePaletteBoxEffect(containerRef, boxType, visualStyle);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    onActivate(boxType);
  };

  const name = SPOKEN_NAMES[boxType] ?? boxType;

  return (
    <div
      draggable
      onKeyDown={handleKeyDown}
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
      aria-label={
        onActivate
          ? `Add ${name} box. Press Enter to add it to the canvas, or drag it`
          : `Draggable ${name} box`
      }
    />
  );
}
