import { CanvasElement } from "../../types";
import rough from "roughjs/bin/rough";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openPrimitiveInterface: (el: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
};

export default function PrimitiveBoxCanvas({
  element,
  openPrimitiveInterface,
  updatePosition,
}: Props) {
  const gRef = useRef<SVGGElement>(null);
  const roughSvg = useRef<ReturnType<typeof rough.svg> | null>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });

  // get true scale for resizing (when canvas changes size)
  const scale = 2;
  const mainW = 60 * scale;
  const mainH = 24 * scale;
  const pad   = 3  * scale;
  const totalW = mainW + 2 * pad;
  const totalH = mainH + 2 * pad;
  const halfW  = totalW / 2;
  const halfH  = totalH / 2;

  useEffect(() => {
    if (!roughSvg.current) {
      const tempSvg = document.createElementNS(
        "http://www.w3.org/2000/svg", "svg"
      );
      roughSvg.current = rough.svg(tempSvg);
    }
    if (!gRef.current || !roughSvg.current) return;

    // redraw the box
    gRef.current.innerHTML = "";
    const rc = roughSvg.current;
    const mainX = pad, mainY = pad;

    // outer border
    gRef.current.appendChild(
      rc.rectangle(
        mainX - pad,
        mainY - pad,
        mainW + 2 * pad,
        mainH + 2 * pad,
        { stroke: "#333", strokeWidth: 1, fill: "transparent" }
      )
    );
    // inner fill
    gRef.current.appendChild(
      rc.rectangle(
        mainX,
        mainY,
        mainW,
        mainH,
        { stroke: "#333", strokeWidth: 1, fill: "#fdf6e3", fillStyle: "solid" }
      )
    );
    // id box
    gRef.current.appendChild(
      rc.rectangle(
        mainX,
        mainY,
        14 * scale,
        8  * scale,
        { stroke: "#555", strokeWidth: 0.8, fill: "#fff", fillStyle: "solid" }
      )
    );
    // type box
    gRef.current.appendChild(
      rc.rectangle(
        mainX + mainW - 14 * scale,
        mainY,
        14 * scale,
        8  * scale,
        { stroke: "#555", strokeWidth: 0.8, fill: "#fff", fillStyle: "solid" }
      )
    );
  }, [element]);

  // convert clientX/Y to SVG coordinates for better dragging logic
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
    // calcalations to find scaled size of
    const pt = getSvgPoint(e as any);
    const dx = pt.x - start.current.x;
    const dy = pt.y - start.current.y;
    let newX = origin.current.x + dx;
    let newY = origin.current.y + dy;

    // clamp to SVG viewBox bounds
    const svg = gRef.current!.ownerSVGElement!;
    const vb  = svg.viewBox.baseVal;
    newX = Math.min(Math.max(newX, vb.x + halfW), vb.x + vb.width  - halfW);
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
      onClick={(e) => { e.stopPropagation(); openPrimitiveInterface(element); }}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
    />
  );
}
