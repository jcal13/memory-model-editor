/**
 * Custom hook for creating a vertically resizable split panel.
 * Allows users to drag a divider to adjust the height allocation between two sections.
 */

import { useRef, useCallback, useState } from "react";

interface UseResizableParams {
  initialTopPercent: number;
  minTopPercent?: number;
  maxTopPercent?: number;
}

/**
 * Hook to manage vertical resizing between two panel sections.
 *
 * @param initialTopPercent - Initial percentage height for the top section (0-100)
 * @param minTopPercent - Minimum percentage height for the top section (default: 20)
 * @param maxTopPercent - Maximum percentage height for the top section (default: 80)
 * @returns Object containing topHeight percentage and divider mouse handlers
 *
 * @example
 * const { topHeight, handleMouseDown } = useResizable({ initialTopPercent: 60 });
 * <div style={{ height: `${topHeight}%` }}>Top Section</div>
 * <div onMouseDown={handleMouseDown}>Divider</div>
 * <div style={{ height: `${100 - topHeight}%` }}>Bottom Section</div>
 */
export function useResizable({
  initialTopPercent,
  minTopPercent = 20,
  maxTopPercent = 80,
}: UseResizableParams) {
  const [topHeight, setTopHeight] = useState(initialTopPercent);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = event.clientY - containerRect.top;

      // Calculate new top height as a percentage
      let newTopPercent = (mouseY / containerHeight) * 100;

      // Clamp to min/max bounds
      newTopPercent = Math.max(minTopPercent, Math.min(maxTopPercent, newTopPercent));

      setTopHeight(newTopPercent);
    },
    [minTopPercent, maxTopPercent]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      isDraggingRef.current = true;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  return {
    topHeight,
    handleMouseDown,
    containerRef,
  };
}
