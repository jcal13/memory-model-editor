import { CanvasElement } from "../../types";
import rough from "roughjs/bin/rough";
import React, { useEffect, useRef } from "react";

// replace this entire file with code from issue #4

type Props = {
  element: CanvasElement;
  openFunctionInterface: (el: CanvasElement | null) => void;
};

export default function FunctionBoxCanvas({ element, openFunctionInterface }: Props) {
  const gRef = useRef<SVGGElement>(null);
  const roughSvg = useRef<ReturnType<typeof rough.svg> | null>(null);

  useEffect(() => {
    if (!roughSvg.current) {
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      roughSvg.current = rough.svg(tempSvg);
    }
    if (!gRef.current || !roughSvg.current) return;

    gRef.current.innerHTML = ""; // Clear previous drawing
    const rc = roughSvg.current;

    const scale = 2;
    const mainX = 10 * scale;
    const mainY = 10 * scale;
    const mainWidth = 60 * scale;
    const mainHeight = 24 * scale;
    const doubleBoxPadding = 3 * scale;

    const outerRect = rc.rectangle(
      mainX - doubleBoxPadding,
      mainY - doubleBoxPadding,
      mainWidth + 2 * doubleBoxPadding,
      mainHeight + 2 * doubleBoxPadding,
      { stroke: "#333", strokeWidth: 1, fill: "#fdf6e3", fillStyle: "solid" }
    );

    const idBoxWidth = 14 * scale;
    const idBoxHeight = 8 * scale;
    const idBoxX = mainX - 2 * scale - 1;
    const idBoxY = mainY - 2 * scale - 1; 

    const idBox = rc.rectangle(idBoxX, idBoxY, idBoxWidth, idBoxHeight, {
      stroke: "#555",
      strokeWidth: 0.8,
      fill: "#fff",
      fillStyle: "solid",
    });

    gRef.current.appendChild(outerRect);
    gRef.current.appendChild(idBox);
  }, [element]);

  return (
    <g
      ref={gRef}
      transform={`translate(${element.x - 75}, ${element.y - 50})`}
      onClick={() => openFunctionInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}
