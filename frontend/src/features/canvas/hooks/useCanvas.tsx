/**
 * Custom hooks for canvas functionality including drag-and-drop, resizing, and SVG rendering.
 * These hooks manage the interactive canvas behavior and element manipulation.
 */

import { useRef, useEffect, useCallback } from "react";
import { createBoxRenderer } from "../utils/box.renderer";
import {
  CanvasElement,
  RenderMode,
  VisualStyle,
} from "../../shared/types";
import { DragState, BoxDimensions } from "../utils/box.types";
import {
  getCallStackBounds,
  smoothlyConstrainDragPosition
} from "../utils/boundary.helpers";

/**
 * Creates and manages refs for the main canvas SVG and drag container.
 *
 * @returns Object containing svgRef and dragRef
 *
 * @example
 * const { svgRef, dragRef } = useCanvasRefs();
 * <svg ref={svgRef}>...</svg>
 */
export function useCanvasRefs() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  return { svgRef, dragRef };
}

/**
 * Initializes and manages drag state for a canvas box element.
 * Tracks drag status, start position, and element dimensions.
 *
 * @returns Object containing gRef (element ref), dragState, and dimensions
 *
 * @example
 * const { gRef, dragState, dimensions } = useBoxDragState();
 * <g ref={gRef}>...</g>
 */
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

/**
 * Handles canvas resize events and updates the SVG viewBox accordingly.
 * Ensures the canvas adapts to window size changes.
 *
 * @param svgRef - Reference to the SVG element
 * @param setViewBox - Optional callback to update viewBox state
 *
 * @example
 * const svgRef = useRef<SVGSVGElement>(null);
 * useCanvasResize(svgRef, (vb) => console.log('New viewBox:', vb));
 */
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

/**
 * Implements drag-and-drop behavior for a canvas box element.
 * Handles mouse events, boundary constraints, and position updates.
 *
 * Features:
 * - Smooth dragging with SVG coordinate transformation
 * - Call stack boundary collision detection
 * - Canvas edge clamping
 * - Click vs drag detection
 * - Prevents text selection during drag
 *
 * @param params - Configuration object
 * @param params.gRef - Reference to the SVG group element
 * @param params.element - Canvas element being dragged
 * @param params.dimensions - Mutable ref to element dimensions
 * @param params.dragState - Mutable ref to drag state
 * @param params.openInterface - Callback when element is clicked (not dragged)
 * @param params.updatePosition - Callback when drag completes with new position
 * @param params.invalidated - Whether element has validation errors (affects styling)
 * @param params.disableDrag - If true, element is not draggable (click-only)
 * @param params.callStackWidth - Width of call stack for boundary calculations
 *
 * @example
 * useDraggableBox({
 *   gRef,
 *   element,
 *   dimensions,
 *   dragState,
 *   openInterface: (el) => setSelected(el),
 *   updatePosition: (x, y) => moveElement(element.id, x, y),
 *   invalidated: false,
 *   disableDrag: false,
 *   callStackWidth: 225,
 * });
 */
export function useDraggableBox({
  gRef,
  element,
  dimensions,
  dragState,
  openInterface,
  updatePosition,
  invalidated = false,
  disableDrag = false,
  callStackWidth,
  visualStyle = "memoryviz",
  elementsById,
  renderMode = "canvas",
}: {
  gRef: React.RefObject<SVGGElement | null>;
  element: CanvasElement;
  dimensions: React.MutableRefObject<BoxDimensions>;
  dragState: React.MutableRefObject<DragState>;
  openInterface: (element: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
  invalidated?: boolean;
  disableDrag?: boolean;
  callStackWidth?: number;
  visualStyle?: VisualStyle;
  elementsById?: Map<number, CanvasElement>;
  renderMode?: RenderMode;
}) {
  const livePosRef = useRef({ x: element.x, y: element.y });
  const movedRef = useRef(false);
  const boxSvgRef = useRef<SVGSVGElement | null>(null);
  const CLICK_EPS = 3;

  const getSvgPoint = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      const svg = gRef.current?.ownerSVGElement;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const ctm = svg.getScreenCTM();
      return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
    },
    [gRef]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      const point = getSvgPoint(event);
      const dx = point.x - dragState.current.startPoint.x;
      const dy = point.y - dragState.current.startPoint.y;
      if (!movedRef.current && dx * dx + dy * dy > CLICK_EPS * CLICK_EPS) {
        movedRef.current = true;
      }

      const svg = gRef.current?.ownerSVGElement;
      if (!svg) return;
      const vb = svg.viewBox.baseVal;
      const { width, height } = dimensions.current;
      if (!width || !height || !vb || !vb.width || !vb.height) return;

      const halfW = width / 2;
      const halfH = height / 2;
      const clamp = (v: number, min: number, max: number) =>
        Math.min(Math.max(v, min), max);

      let newX = clamp(
        dragState.current.originalPosition.x + dx,
        vb.x + halfW,
        vb.x + vb.width - halfW
      );
      let newY = clamp(
        dragState.current.originalPosition.y + dy,
        vb.y + halfH,
        vb.y + vb.height - halfH
      );

      const callStackBounds = getCallStackBounds(vb?.height, 0, 0, callStackWidth ?? 225);
      const constrainedPosition = smoothlyConstrainDragPosition(
        { x: newX, y: newY },
        { width, height },
        callStackBounds,
        { width: vb.width, height: vb.height }
      );

      newX = constrainedPosition.x;
      newY = constrainedPosition.y;

      livePosRef.current = { x: newX, y: newY };

      gRef.current?.setAttribute(
        "transform",
        `translate(${newX - halfW}, ${newY - halfH})`
      );
    },
    [getSvgPoint, dimensions, dragState, gRef, callStackWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;

    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    const { x, y } = livePosRef.current;

    requestAnimationFrame(() => {
      updatePosition(x, y);
    });
  }, [handleMouseMove, updatePosition, dragState]);

  const findReferencedElement = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (visualStyle !== "pythonTutor" || !elementsById || !boxSvgRef.current) {
        return null;
      }

      const boxSvg = boxSvgRef.current;
      const ctm = boxSvg.getScreenCTM();
      if (!ctm) return null;

      const point = boxSvg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const localPoint = point.matrixTransform(ctm.inverse());

      const hitTargets = Array.from(
        boxSvg.querySelectorAll<SVGRectElement>("[data-ref-target-id]")
      );

      for (const hitTarget of hitTargets) {
        const x = parseFloat(hitTarget.getAttribute("x") || "0");
        const y = parseFloat(hitTarget.getAttribute("y") || "0");
        const width = parseFloat(hitTarget.getAttribute("width") || "0");
        const height = parseFloat(hitTarget.getAttribute("height") || "0");

        const isInside =
          localPoint.x >= x &&
          localPoint.x <= x + width &&
          localPoint.y >= y &&
          localPoint.y <= y + height;

        if (!isInside) continue;

        const targetId = parseInt(
          hitTarget.getAttribute("data-ref-target-id") || "",
          10
        );
        if (!Number.isInteger(targetId)) continue;

        const target = elementsById.get(targetId);
        if (
          target &&
          !(visualStyle === "pythonTutor" && target.kind.name === "primitive")
        ) {
          return target;
        }
      }

      return null;
    },
    [elementsById, visualStyle]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.stopPropagation();
      if (findReferencedElement(event)) {
        movedRef.current = false;
        return;
      }

      movedRef.current = false;
      dragState.current.isDragging = true;

      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      const p = getSvgPoint(event);
      dragState.current.startPoint = { x: p.x, y: p.y };
      dragState.current.originalPosition = { x: element.x, y: element.y };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [
      element.x,
      element.y,
      getSvgPoint,
      handleMouseMove,
      handleMouseUp,
      findReferencedElement,
      dragState,
    ]
  );

  useEffect(() => {
    livePosRef.current = { x: element.x, y: element.y };
  }, [element.x, element.y]);

  useEffect(() => {
    const container = gRef.current;
    if (!container) return;

    const svgElement = createBoxRenderer(element, {
      visualStyle,
      elementsById,
      renderMode,
    });
    boxSvgRef.current = svgElement;
    const padding = 12;

    container.innerHTML = "";
    container.appendChild(svgElement);

    if (invalidated) {
      const GREY = "#9CA3AF";
      svgElement
        .querySelectorAll<SVGElement>("rect,path,polygon,ellipse,circle")
        .forEach((s) => {
          if (!s.closest("defs") && !s.hasAttribute("data-overlay")) {
            s.style.setProperty("stroke", GREY, "important");
          }
        });
      svgElement
        .querySelectorAll<SVGElement>("text,tspan")
        .forEach((t) => t.style.setProperty("fill", GREY, "important"));
    }

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

    container.setAttribute(
      "transform",
      `translate(${element.x - width / 2}, ${element.y - height / 2})`
    );

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
    overlay.style.cursor = disableDrag ? "pointer" : "grab";
    overlay.style.userSelect = 'none';

    const handleClick = (ev: MouseEvent) => {
      ev.stopPropagation();
      if (movedRef.current) return;
      const targetElement = findReferencedElement(ev);
      openInterface(targetElement ?? element);
    };

    const handleOverlayMouseMove = (ev: MouseEvent) => {
      const targetElement = findReferencedElement(ev);
      overlay.style.cursor = targetElement
        ? "pointer"
        : disableDrag
        ? "pointer"
        : "grab";
    };

    if (!disableDrag) {
      overlay.addEventListener("mousedown", handleMouseDown as EventListener);
    }
    overlay.addEventListener("click", handleClick);
    overlay.addEventListener("mousemove", handleOverlayMouseMove);
    svgElement.appendChild(overlay);

    return () => {
      if (!disableDrag) {
        overlay.removeEventListener(
          "mousedown",
          handleMouseDown as EventListener
        );
      }
      overlay.removeEventListener("click", handleClick);
      overlay.removeEventListener("mousemove", handleOverlayMouseMove);
      boxSvgRef.current = null;
    };
  }, [
    element,
    invalidated,
    handleMouseDown,
    openInterface,
    gRef,
    dimensions,
    disableDrag,
    visualStyle,
    elementsById,
    renderMode,
    findReferencedElement,
  ]);
}
