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
  const dragState = useRef<DragState>({
    isDragging: false,
    startPoint: { x: 0, y: 0 },
    originalPosition: { x: 0, y: 0 },
  });
  const dimensions = useRef<BoxDimensions>({ width: 0, height: 0 });

  return { gRef, dragState, dimensions };
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

// Draggable box behavior hook
export function useDraggableBox({
  gRef,
  element,
  dimensions,
  dragState,
  openInterface,
  updatePosition,
  invalidated = false,
}: {
  gRef: React.RefObject<SVGGElement | null>;
  element: CanvasElement;
  dimensions: React.MutableRefObject<BoxDimensions>;
  dragState: React.MutableRefObject<DragState>;
  openInterface: (element: CanvasElement) => void;
  updatePosition: (x: number, y: number) => void;
  invalidated?: boolean;
}) {
  const getSvgPoint = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      const svg = gRef.current!.ownerSVGElement!;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM()!.inverse());
    },
    [gRef]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.stopPropagation();
      dragState.current.isDragging = true;
      const point = getSvgPoint(event);
      dragState.current.startPoint = { x: point.x, y: point.y };
      dragState.current.originalPosition = { x: element.x, y: element.y };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [element.x, element.y, getSvgPoint]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      const point = getSvgPoint(event);
      const deltaX = point.x - dragState.current.startPoint.x;
      const deltaY = point.y - dragState.current.startPoint.y;

      const svg = gRef.current!.ownerSVGElement!;
      const viewBox = svg.viewBox.baseVal;
      const { width, height } = dimensions.current;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

      const newX = clamp(
        dragState.current.originalPosition.x + deltaX,
        viewBox.x + halfWidth,
        viewBox.x + viewBox.width - halfWidth
      );
      const newY = clamp(
        dragState.current.originalPosition.y + deltaY,
        viewBox.y + halfHeight,
        viewBox.y + viewBox.height - halfHeight
      );

      updatePosition(newX, newY);
    },
    [getSvgPoint, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    const container = gRef.current;
    if (!container) return;

    // Render the box
    const svgElement = createBoxRenderer(element);
    const padding = 12;

    // Clear and append
    container.innerHTML = "";
    container.appendChild(svgElement);

    // Style invalidated elements
    if (invalidated) {
      const GREY_COLOR = "#9CA3AF";
      const texts = svgElement.querySelectorAll<SVGElement>("text, tspan");
      const shapes = svgElement.querySelectorAll<SVGElement>(
        "rect,path,polygon,ellipse,circle"
      );

      shapes.forEach((shape) => {
        if (!shape.closest("defs") && !shape.hasAttribute("data-overlay")) {
          shape.style.setProperty("stroke", GREY_COLOR, "important");
        }
      });
      texts.forEach((text) => {
        text.style.setProperty("fill", GREY_COLOR, "important");
      });
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

    dimensions.current = { width, height };

    // Position the container
    container.setAttribute(
      "transform",
      `translate(${element.x - width / 2}, ${element.y - height / 2})`
    );

    // Create overlay for interactions
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

    const handleClick = (event: MouseEvent) => {
      event.stopPropagation();
      openInterface(element);
    };

    overlay.addEventListener("mousedown", handleMouseDown as EventListener);
    overlay.addEventListener("click", handleClick);
    svgElement.appendChild(overlay);

    return () => {
      overlay.removeEventListener(
        "mousedown",
        handleMouseDown as EventListener
      );
      overlay.removeEventListener("click", handleClick);
    };
  }, [element, invalidated, handleMouseDown, openInterface]);
}
