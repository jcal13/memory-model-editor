import { CanvasElement } from "../../types";
import rough from "roughjs/bin/rough";
import React, { useEffect, useRef } from "react";

type Props = {
  element: CanvasElement;
  openListInterface: (el: CanvasElement | null) => void;
  updatePosition: (x: number, y: number) => void;
};

export default function TupleBoxCanvas({ element, openListInterface, updatePosition }: Props) {
  const gRef = useRef<SVGGElement>(null);
  const roughSvg = useRef<ReturnType<typeof rough.svg> | null>(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!roughSvg.current) {
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      roughSvg.current = rough.svg(tempSvg);
    }
    if (!gRef.current || !roughSvg.current) return;

    gRef.current.innerHTML = "";
    const rc = roughSvg.current;

    const scale = 2;
    const mainX = 10 * scale;
    const mainY = 10 * scale;
    const mainWidth = 60 * scale;
    const mainHeight = 24 * scale;
    const doubleBoxPadding = 3 * scale;

    // outer rectangle
    gRef.current.appendChild(
      rc.rectangle(
        mainX - doubleBoxPadding,
        mainY - doubleBoxPadding,
        mainWidth + 2 * doubleBoxPadding,
        mainHeight + 2 * doubleBoxPadding,
        { stroke: "#333", strokeWidth: 1, fill: "#fdf6e3", fillStyle: "solid" }
      )
    );

    const idBoxWidth = 14 * scale;
    const idBoxHeight = 8 * scale;
    const idBoxX = mainX - 2 * scale - 1;
    const idBoxY = mainY - 2 * scale - 1;
    gRef.current.appendChild(
      rc.rectangle(idBoxX, idBoxY, idBoxWidth, idBoxHeight, {
        stroke: "#555",
        strokeWidth: 0.8,
        fill: "#fff",
        fillStyle: "solid",
      })
    );

    const typeBoxWidth = 14 * scale;
    const typeBoxHeight = 8 * scale;
    const typeBoxX = mainX + mainWidth + 2 * scale - typeBoxWidth + 1;
    const typeBoxY = idBoxY;
    gRef.current.appendChild(
      rc.rectangle(typeBoxX, typeBoxY, typeBoxWidth, typeBoxHeight, {
        stroke: "#555",
        strokeWidth: 0.8,
        fill: "#fff",
        fillStyle: "solid",
      })
    );

    const svgNS = "http://www.w3.org/2000/svg";
    const squareSize = 10 * scale;
    const mainText = document.createElementNS(svgNS, "text");
    const textX = mainX + mainWidth / 2;
    const textY = mainY + mainHeight / 2 + squareSize / 2;
    mainText.setAttribute("x", textX.toString());
    mainText.setAttribute("y", textY.toString());
    mainText.setAttribute("text-anchor", "middle");
    mainText.setAttribute("font-family", "sans-serif");
    mainText.setAttribute("font-size", squareSize.toString());
    mainText.setAttribute("fill", "#333");
    mainText.textContent = "[]";
    gRef.current.appendChild(mainText);
  }, [element]);

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

    const svg = gRef.current!.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const halfW = (60 * 2 + 2 * (3 * 2)) / 2;
    const halfH = (24 * 2 + 2 * (3 * 2)) / 2;
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
      transform={`translate(${element.x - 75}, ${element.y - 50})`}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        openListInterface(element);
      }}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
    />
  );
}
