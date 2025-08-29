import { useRef, useEffect, useCallback } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";
import { CanvasElement } from "../../shared/types";
import { DragState, BoxDimensions } from "../utils/types";

// Canvas refs hook
export function useCanvasRefs() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  return { svgRef, dragRef };
}

// Box drag state hook
export function useBoxDragState() {
  const gRef = useRef<SVGGElement>(null);
  const isDragging = useRef(false); // whether the box is currently being dragged
  const start = useRef({ x: 0, y: 0 }); // starting mouse position
  const origin = useRef({ x: 0, y: 0 }); // original position of the box
  const halfSize = useRef({ w: 0, h: 0 }); // half width/height of box for bounding

  return { gRef, isDragging, start, origin, halfSize };
}

// Canvas resize hook
export function useCanvasResize(
  svgRef: React.RefObject<SVGSVGElement>,
  setViewBox?: (viewBox: string) => void
) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleResize = () => {
      const { width, height } = svg.getBoundingClientRect();
      const viewBoxValue = `0 0 ${width} ${height}`;
      svg.setAttribute("viewBox", viewBoxValue);
      setViewBox?.(viewBoxValue);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [svgRef, setViewBox]);
}

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

// Draggable box behavior hook
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

    const texts = Array.from(
      svgElement.querySelectorAll<SVGElement>("text, tspan")
    );
    const shapes = Array.from(
      svgElement.querySelectorAll<SVGElement>(
        "rect,path,polygon,ellipse,circle"
      )
    ).filter((el) => !el.closest("defs") && !el.hasAttribute("data-overlay"));

    [...shapes, ...texts].forEach((s) => {
      s.style.removeProperty("stroke");
      s.style.removeProperty("fill");
      s.style.removeProperty("filter");
      s.style.removeProperty("fill-opacity");
    });

    const COLOUR = "#9CA3AF";
    if (invalidated) {
      shapes.forEach((s) => s.style.setProperty("stroke", COLOUR, "important"));
      texts.forEach((t) => t.style.setProperty("fill", COLOUR, "important"));
    }

    // Calculate dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width + padding * 2;
    const height = bbox.height + padding * 2;

    svgElement.setAttribute(
      "viewBox",
      `-${padding} -${padding} ${width} ${height}`
    );
    svgElement.setAttribute("width", `${width}`);
    svgElement.setAttribute("height", `${height}`);

    halfSize.current = { w: width / 2, h: height / 2 };

    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - halfSize.current.w}, ${
        element.y - halfSize.current.h
      })`
    );

    // Transparent overlay for dragging and clicking
    const overlay = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    overlay.setAttribute("x", `-${padding}`);
    overlay.setAttribute("y", `-${padding}`);
    overlay.setAttribute("width", `${width}`);
    overlay.setAttribute("height", `${height}`);
    overlay.setAttribute("fill", "transparent");
    overlay.setAttribute("data-overlay", "true");
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
