import { useEffect } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";

export const usePaletteBoxEffect = (containerRef: any, boxType: any) => {
  useEffect(() => {
    const svg = createBoxRenderer(boxType);
    const container = containerRef.current;
    if (container) {
      container.innerHTML = "";
      container.appendChild(svg);

      const padding = 5;
      const bbox = svg.getBBox();
      container.style.width = `${bbox.width + padding}px`;
      container.style.height = `${bbox.height + padding}px`;
    }
  }, [boxType, containerRef]);
};
