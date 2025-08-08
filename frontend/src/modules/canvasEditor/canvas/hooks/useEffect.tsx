import { useEffect } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";

/**
 * Syncs the given ref with the current `dataType` state on every change.
 */
export const useDataType = (
  dataTypeRef: React.MutableRefObject<any>,
  dataType: any
) => {
  useEffect(() => {
    dataTypeRef.current = dataType;
  }, [dataType]);
};

/**
 * Syncs the given ref with the current `contentValue` state on every change.
 */
export const useContentValue = (
  contentValueRef: React.MutableRefObject<any>,
  contentValue: any
) => {
  useEffect(() => {
    contentValueRef.current = contentValue;
  }, [contentValue]);
};

/**
 * Sets and updates the SVG viewBox based on container size.
 * Automatically adjusts on window resize.
 */
export const useCanvasResize = (
  svgRef: any,
  setViewBox: (vb: string) => void
) => {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const recalc = () => {
      const { width, height } = svg.getBoundingClientRect();
      setViewBox(`0 0 ${width} ${height}`);
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [svgRef, setViewBox]);
};

// =========================
// Draggable Canvas Box Hook
// =========================

interface DraggableParams {
  gRef: any;
  element: any;
  halfSize: any;
  openInterface: any;
  isDragging: any;
  start: any;
  origin: any;
  updatePosition: (x: number, y: number) => void;
  invalidated?: boolean;
}

/**
 * Enables drag interaction and overlay click handling for a <g> SVG box.
 */
export const useDraggableBox = ({
  gRef,
  element,
  halfSize,
  openInterface,
  isDragging,
  start,
  origin,
  updatePosition,
  invalidated = false,
}: DraggableParams) => {
  // Converts mouse coordinates to SVG coordinates
  const getSvgPoint = (e: MouseEvent | React.MouseEvent) => {
    const svg = gRef.current!.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = (e as MouseEvent).clientX ?? (e as React.MouseEvent).clientX;
    pt.y = (e as MouseEvent).clientY ?? (e as React.MouseEvent).clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  // Handles starting a drag
  const onMouseDown = (e: MouseEvent | React.MouseEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    const pt = getSvgPoint(e);
    start.current = { x: pt.x, y: pt.y };
    origin.current = { x: element.x, y: element.y };
    window.addEventListener("mousemove", onMouseMove as any);
    window.addEventListener("mouseup", onMouseUp as any);
  };

  // Handles dragging movement
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const pt = getSvgPoint(e);
    const dx = pt.x - start.current.x;
    const dy = pt.y - start.current.y;

    const svg = gRef.current!.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const { w, h } = halfSize.current;

    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    const newX = clamp(origin.current.x + dx, vb.x + w, vb.x + vb.width - w);
    const newY = clamp(origin.current.y + dy, vb.y + h, vb.y + vb.height - h);
    updatePosition(newX, newY);
  };

  // Ends dragging
  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", onMouseMove as any);
    window.removeEventListener("mouseup", onMouseUp as any);
  };

  // Initialize box render and overlay
  useEffect(() => {
    if (!gRef.current) return;

    // Render SVG element
    const svgElement = createBoxRenderer(element);
    const padding = 12;

    // Reset container
    gRef.current.innerHTML = "";
    gRef.current.appendChild(svgElement);

    /* ----- invalidated tint (apply grayscale to shapes only) ----- */
    // Select elements *inside* the rendered box, not the wrapper <g>.
    const rects = Array.from(svgElement.querySelectorAll("rect"));
    const texts = Array.from(svgElement.querySelectorAll<SVGElement>("text, tspan"));

    // Clean any previous styles first
    rects.forEach(r => (r as SVGElement).style.removeProperty("filter"));
    texts.forEach(t => (t as SVGElement).style.removeProperty("fill"));

    const COLOUR = "#9CA3AF";

    const shapes = Array.from(
      svgElement.querySelectorAll<SVGElement>("rect,path,polygon,ellipse,circle")
    ).filter(el => !el.closest("defs") && !el.hasAttribute("data-overlay"));

    shapes.forEach(s => {
      s.style.removeProperty("filter");
      s.style.removeProperty("fill");
      s.style.removeProperty("fill-opacity");
    });
    texts.forEach(t => t.style.removeProperty("fill"));

    if (invalidated) {
      shapes.forEach(s => {
        s.style.setProperty("stroke", COLOUR, "important");
      });

      texts.forEach(t => {
        t.style.setProperty("fill", COLOUR, "important");
      });
    } else {
      shapes.forEach(s => {
        if (s.style.stroke === COLOUR) s.style.removeProperty("stroke");
      });
      texts.forEach(t => t.style.removeProperty("fill"));
    }

    // Calculate dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width + padding * 2;
    const height = bbox.height + padding * 2;

    svgElement.setAttribute("viewBox", `-${padding} -${padding} ${width} ${height}`);
    svgElement.setAttribute("width", `${width}`);
    svgElement.setAttribute("height", `${height}`);

    halfSize.current = { w: width / 2, h: height / 2 };

    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - halfSize.current.w}, ${element.y - halfSize.current.h})`
    );

    // Transparent overlay for dragging and clicking
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    overlay.setAttribute("x", `-${padding}`);
    overlay.setAttribute("y", `-${padding}`);
    overlay.setAttribute("width", `${width}`);
    overlay.setAttribute("height", `${height}`);
    overlay.setAttribute("fill", "transparent");
    overlay.setAttribute("data-overlay", "true"); // so it won't be grayscaled
    overlay.style.cursor = "grab";

    const clickHandler = (e: MouseEvent) => {
      e.stopPropagation();
      openInterface(element);
    };

    overlay.addEventListener("mousedown", onMouseDown as any);
    overlay.addEventListener("click", clickHandler as any);

    svgElement.appendChild(overlay);

    // Cleanup on re-render/unmount
    return () => {
      overlay.removeEventListener("mousedown", onMouseDown as any);
      overlay.removeEventListener("click", clickHandler as any);
    };
  }, [element, invalidated]);
};
