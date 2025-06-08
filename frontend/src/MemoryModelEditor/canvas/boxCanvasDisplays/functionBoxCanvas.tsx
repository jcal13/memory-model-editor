import { CanvasElement } from "../../types";
import rough from "roughjs/bin/rough";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openFunctionInterface: (el: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
};

export default function FunctionBoxCanvas({ element, openFunctionInterface, updatePosition }: Props) {
  const gRef = useRef<SVGGElement>(null);
  const roughSvg = useRef<ReturnType<typeof rough.svg> | null>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });

  // dimensions
  const scale = 2;
  const mainX = 10 * scale;
  const mainY = 10 * scale;
  const mainWidth = 60 * scale;
  const mainHeight = 24 * scale;
  const pad = 3 * scale;
  const outerW = mainWidth + 2 * pad;
  const outerH = mainHeight + 2 * pad;
  const halfW = outerW / 2;
  const halfH = outerH / 2;

  useEffect(() => {
    if (!roughSvg.current) {
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      roughSvg.current = rough.svg(tempSvg);
    }
    if (!gRef.current || !roughSvg.current) return;

    gRef.current.innerHTML = "";
    const rc = roughSvg.current;

    // outer rectangle
    gRef.current.appendChild(
      rc.rectangle(
        mainX - pad,
        mainY - pad,
        mainWidth + 2 * pad,
        mainHeight + 2 * pad,
        { stroke: "#333", strokeWidth: 1, fill: "#fdf6e3", fillStyle: "solid" }
      )
    );

    // ID box
    const idBoxW = 14 * scale;
    const idBoxH = 8 * scale;
    const idBoxX = mainX - 2 * scale - 1;
    const idBoxY = mainY - 2 * scale - 1;
    gRef.current.appendChild(
      rc.rectangle(
        idBoxX,
        idBoxY,
        idBoxW,
        idBoxH,
        { stroke: "#555", strokeWidth: 0.8, fill: "#fff", fillStyle: "solid" }
      )
    );
  }, [element]);

  // convert client coords to SVG point
  function getSvgPoint(e: MouseEvent | React.MouseEvent) {
    const svg = gRef.current!.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  const onMouseDown = (e: React.MouseEvent<SVGGElement>) => {
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
    const pt = getSvgPoint(e as any);
    const dx = pt.x - start.current.x;
    const dy = pt.y - start.current.y;
    let newX = origin.current.x + dx;
    let newY = origin.current.y + dy;

    // clamp within viewBox
    const svg = gRef.current!.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    newX = Math.min(Math.max(newX, vb.x + halfW), vb.x + vb.width - halfW);
    newY = Math.min(Math.max(newY, vb.y + halfH), vb.y + vb.height - halfH);

    updatePosition(newX, newY);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <g
      ref={gRef}
      transform={`translate(${element.x - halfW}, ${element.y - halfH})`}
      onMouseDown={onMouseDown}
      onClick={(e) => { e.stopPropagation(); openFunctionInterface(element); }}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
    />
  );
}
