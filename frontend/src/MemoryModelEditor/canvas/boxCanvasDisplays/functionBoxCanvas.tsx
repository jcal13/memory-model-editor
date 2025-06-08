import React, { useEffect, useRef } from "react";
import MemoryViz from "memory-viz";
import { CanvasElement } from "../../types";

type Props = {
  element: CanvasElement;
  openFunctionInterface: (el: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
};

export default function FunctionBoxCanvas({
  element,
  openFunctionInterface,
  updatePosition,
}: Props) {
  const gRef = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const halfSize = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!gRef.current || element.kind.name !== "function") return;

    const model = createFunctionBox(element);
    const padding = 10;

    gRef.current.innerHTML = "";
    gRef.current.appendChild(model.svg);

    const bbox = model.svg.getBBox();
    const width = bbox.width + padding * 2;
    const height = bbox.height + padding * 2;

    model.svg.setAttribute("viewBox", `-${padding} -${padding} ${width} ${height}`);
    model.svg.setAttribute("width", `${width}`);
    model.svg.setAttribute("height", `${height}`);

    halfSize.current = { w: width / 2, h: height / 2 };
    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - halfSize.current.w}, ${element.y - halfSize.current.h})`
    );

    setupOverlay(model.svg, width, height, padding);
  }, [element]);

  const createFunctionBox = (element: CanvasElement) => {
    const { MemoryModel } = MemoryViz;
    const kind = element.kind;

    const model = new MemoryModel({
      obj_min_width: 190,
      obj_min_height: 90,
      prop_min_width: 50,
      prop_min_height: 40,
      double_rect_sep: 10,
      font_size: 18,
      browser: true,
      roughjs_config: { options: { fillStyle: "solid" } },
    });

    const props: Record<string, number | null> = {};
    if ("params" in kind && Array.isArray(kind.params)) {
      kind.params.forEach((p) => {
        props[p.name] = p.targetId;
      });
    }

    model.drawClass(0, 0, kind.name, Number(element.id), props, true, {
      box_id: { fill: "#fff", fillStyle: "solid" },
      box_type: { fill: "#fff", fillStyle: "solid" },
    });

    return model;
  };

  const setupOverlay = (
    svg: SVGSVGElement,
    width: number,
    height: number,
    padding: number
  ) => {
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    overlay.setAttribute("x", `-${padding}`);
    overlay.setAttribute("y", `-${padding}`);
    overlay.setAttribute("width", `${width}`);
    overlay.setAttribute("height", `${height}`);
    overlay.setAttribute("fill", "transparent");
    overlay.style.cursor = "grab";

    overlay.addEventListener("mousedown", onMouseDown as any);
    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      openFunctionInterface(element);
    });

    svg.insertBefore(overlay, svg.firstChild);
  };

  const getSvgPoint = (e: MouseEvent | React.MouseEvent) => {
    const svg = gRef.current!.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const onMouseDown = (e: MouseEvent | React.MouseEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    const pt = getSvgPoint(e);
    start.current = { x: pt.x, y: pt.y };
    origin.current = { x: element.x, y: element.y };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const pt = getSvgPoint(e);
    const dx = pt.x - start.current.x;
    const dy = pt.y - start.current.y;

    const svg = gRef.current!.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const { w, h } = halfSize.current;

    const newX = clamp(origin.current.x + dx, vb.x + w, vb.x + vb.width - w);
    const newY = clamp(origin.current.y + dy, vb.y + h, vb.y + vb.height - h);

    updatePosition(newX, newY);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  return <g ref={gRef} />;
}
