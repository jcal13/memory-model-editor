import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CanvasElement } from "../../shared/types";

interface PythonTutorReferenceArrowsProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  enabled: boolean;
  includePrimitiveTargets?: boolean;
  elements: CanvasElement[];
}

interface Point {
  x: number;
  y: number;
}

type RectSide = "left" | "right" | "top" | "bottom";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ArrowPath {
  key: string;
  d: string;
}

interface RectIntersection {
  point: Point;
  side: RectSide;
}

function parseViewBox(svg: SVGSVGElement): Rect {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    };
  }

  const rawViewBox = svg.getAttribute("viewBox");
  if (rawViewBox) {
    const [x, y, width, height] = rawViewBox
      .split(/\s+/)
      .map((value) => parseFloat(value));
    if ([x, y, width, height].every((value) => Number.isFinite(value))) {
      return { x, y, width, height };
    }
  }

  const rect = svg.getBoundingClientRect();
  return {
    x: 0,
    y: 0,
    width: rect.width || 1,
    height: rect.height || 1,
  };
}

function toSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): Point {
  const rootRect = svg.getBoundingClientRect();
  const viewBox = parseViewBox(svg);
  const width = rootRect.width || 1;
  const height = rootRect.height || 1;

  return {
    x: viewBox.x + ((clientX - rootRect.left) / width) * viewBox.width,
    y: viewBox.y + ((clientY - rootRect.top) / height) * viewBox.height,
  };
}

function rectToSvgRect(svg: SVGSVGElement, rect: DOMRect): Rect | null {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const topLeft = toSvgPoint(svg, rect.left, rect.top);
  const bottomRight = toSvgPoint(svg, rect.right, rect.bottom);

  return {
    x: Math.min(topLeft.x, bottomRight.x),
    y: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}

function getRectPerimeterPoint(rect: Rect, towardPoint: Point): RectIntersection {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const dx = towardPoint.x - centerX;
  const dy = towardPoint.y - centerY;

  if (dx === 0 && dy === 0) {
    return {
      point: { x: centerX, y: centerY },
      side: "top",
    };
  }

  const scaleX =
    dx === 0 ? Number.POSITIVE_INFINITY : rect.width / 2 / Math.abs(dx);
  const scaleY =
    dy === 0 ? Number.POSITIVE_INFINITY : rect.height / 2 / Math.abs(dy);
  const preferVertical = Math.abs(dy) >= Math.abs(dx);
  const isTie = Math.abs(scaleX - scaleY) < 1e-6;
  const useHorizontalEdge =
    scaleY < scaleX || (isTie && preferVertical);
  const side: RectSide = useHorizontalEdge
    ? dy < 0
      ? "top"
      : "bottom"
    : dx < 0
    ? "left"
    : "right";
  const scale = useHorizontalEdge ? scaleY : scaleX;

  return {
    point: {
      x: centerX + dx * scale,
      y: centerY + dy * scale,
    },
    side,
  };
}

function createArrowPath(start: Point, end: Point, entrySide: RectSide): string {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const departVertically = Math.abs(deltaY) > Math.abs(deltaX);
  const startOffset = Math.max(
    26,
    (departVertically ? Math.abs(deltaY) : Math.abs(deltaX)) * 0.35
  );
  const endOffset = Math.max(
    26,
    ((entrySide === "top" || entrySide === "bottom")
      ? Math.abs(deltaY)
      : Math.abs(deltaX)) * 0.35
  );

  const control1 = departVertically
    ? {
        x: start.x,
        y: start.y + (deltaY >= 0 ? 1 : -1) * startOffset,
      }
    : {
        x: start.x + (deltaX >= 0 ? 1 : -1) * startOffset,
        y: start.y,
      };

  const control2 = (() => {
    switch (entrySide) {
      case "left":
        return { x: end.x - endOffset, y: end.y };
      case "right":
        return { x: end.x + endOffset, y: end.y };
      case "top":
        return { x: end.x, y: end.y - endOffset };
      case "bottom":
        return { x: end.x, y: end.y + endOffset };
      default:
        return { x: end.x, y: end.y };
    }
  })();

  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
}

function areArrowPathsEqual(current: ArrowPath[], next: ArrowPath[]): boolean {
  if (current.length !== next.length) {
    return false;
  }

  return current.every(
    (arrow, index) =>
      arrow.key === next[index]?.key && arrow.d === next[index]?.d
  );
}

function collectArrowPaths(
  svg: SVGSVGElement,
  includePrimitiveTargets: boolean
): ArrowPath[] {
  const targetNodes = Array.from(
    svg.querySelectorAll<SVGGElement>(
      '[data-canvas-element-id][data-canvas-render-mode="canvas"]'
    )
  );
  const targetsById = new Map<number, Rect>();

  targetNodes.forEach((node) => {
    const targetId = parseInt(node.getAttribute("data-canvas-element-id") || "", 10);
    const kind = node.getAttribute("data-canvas-kind");
    if (
      !Number.isInteger(targetId) ||
      (!includePrimitiveTargets && kind === "primitive")
    ) {
      return;
    }

    const rect = rectToSvgRect(svg, node.getBoundingClientRect());
    if (!rect) {
      return;
    }

    targetsById.set(targetId, rect);
  });

  const sourceNodes = Array.from(
    svg.querySelectorAll<SVGCircleElement>("[data-ref-source-target-id]")
  );

  return sourceNodes.flatMap((node, index) => {
    const targetId = parseInt(
      node.getAttribute("data-ref-source-target-id") || "",
      10
    );
    if (!Number.isInteger(targetId)) {
      return [];
    }

    const targetRect = targetsById.get(targetId);
    if (!targetRect) {
      return [];
    }

    const sourceRect = node.getBoundingClientRect();
    if (sourceRect.width <= 0 || sourceRect.height <= 0) {
      return [];
    }

    const sourcePoint = toSvgPoint(
      svg,
      sourceRect.left + sourceRect.width / 2,
      sourceRect.top + sourceRect.height / 2
    );
    const endPoint = getRectPerimeterPoint(targetRect, sourcePoint);

    return [
      {
        key: `${targetId}-${index}`,
        d: createArrowPath(sourcePoint, endPoint.point, endPoint.side),
      },
    ];
  });
}

export default function PythonTutorReferenceArrows({
  svgRef,
  enabled,
  includePrimitiveTargets = false,
  elements,
}: PythonTutorReferenceArrowsProps) {
  const rawMarkerId = useId();
  const markerId = useMemo(
    () => `python-tutor-reference-arrow-${rawMarkerId.replace(/:/g, "")}`,
    [rawMarkerId]
  );
  const [arrows, setArrows] = useState<ArrowPath[]>([]);
  const frameRef = useRef<number | null>(null);

  const recompute = useCallback(() => {
    const svg = svgRef.current;
    if (!enabled || !svg) {
      setArrows((current) => (current.length === 0 ? current : []));
      return;
    }

    const nextArrows = collectArrowPaths(svg, includePrimitiveTargets);
    setArrows((current) =>
      areArrowPathsEqual(current, nextArrows) ? current : nextArrows
    );
  }, [enabled, includePrimitiveTargets, svgRef]);

  const scheduleRecompute = useCallback(() => {
    if (!enabled) return;
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      recompute();
    });
  }, [enabled, recompute]);

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setArrows([]);
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    scheduleRecompute();

    const mutationObserver = new MutationObserver(() => {
      scheduleRecompute();
    });
    mutationObserver.observe(svg, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      scheduleRecompute();
    });
    resizeObserver.observe(svg);

    const handlePointerMove = () => {
      scheduleRecompute();
    };
    const handleWheel = () => {
      scheduleRecompute();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("resize", scheduleRecompute);
    svg.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", scheduleRecompute);
      svg.removeEventListener("wheel", handleWheel);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, scheduleRecompute, svgRef]);

  useEffect(() => {
    if (!enabled) return;
    scheduleRecompute();
  }, [enabled, elements, includePrimitiveTargets, scheduleRecompute]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--python-tutor-reference-text)" />
        </marker>
      </defs>
      <g data-python-tutor-arrow-overlay="true" style={{ pointerEvents: "none" }}>
        {arrows.map((arrow) => (
          <path
            key={arrow.key}
            d={arrow.d}
            fill="none"
            stroke="var(--python-tutor-reference-text)"
            strokeWidth="2"
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
          />
        ))}
      </g>
    </>
  );
}
