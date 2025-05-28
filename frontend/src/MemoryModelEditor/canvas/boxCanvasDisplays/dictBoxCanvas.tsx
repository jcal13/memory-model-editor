import { CanvasElement } from "../../types";
import rough from "roughjs/bin/rough";
import React, { useEffect, useRef } from "react";

// replace this entire file with code from issue #4

type Props = {
  element: CanvasElement;
  openDictInterface: (el: CanvasElement | null) => void;
};

export default function DictBoxCanvas({ element, openDictInterface: openDictInterface }: Props) {
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

    // Type box (top-right)
    const typeBoxWidth = 14 * scale;
    const typeBoxHeight = 8 * scale;
    const typeBoxX = mainX + mainWidth + 2 * scale - typeBoxWidth + 1;
    const typeBoxY = mainY - 2 * scale - 1;

    const typeBox = rc.rectangle(typeBoxX, typeBoxY, typeBoxWidth, typeBoxHeight, {
      stroke: "#555",
      strokeWidth: 0.8,
      fill: "#fff",
      fillStyle: "solid",
    });

    const svgNS = "http://www.w3.org/2000/svg";
    const squareSize = 10 * scale;
    const gap = 2 * scale;
    // const totalWidth = 3 * squareSize + 2 * gap;

    const mainText = document.createElementNS(svgNS, "text");

    const textX = mainX + (mainWidth) / 2;
    const textY = mainY + (mainHeight) / 2 + 10;

    mainText.setAttribute("x", textX.toString());
    mainText.setAttribute("y", textY.toString());
    mainText.setAttribute("text-anchor", "middle");
    mainText.setAttribute("font-family", "sans-serif");
    mainText.setAttribute("font-size", (squareSize).toString());
    mainText.setAttribute("fill", "#333");
    mainText.textContent = "{}";

    gRef.current.appendChild(outerRect);
    gRef.current.appendChild(idBox);
    gRef.current.appendChild(typeBox);
    gRef.current.appendChild(mainText);
  }, [element]);

  return (
    <g
      ref={gRef}
      transform={`translate(${element.x - 75}, ${element.y - 50})`}
      onClick={() => openDictInterface(element)}
      style={{ cursor: "pointer" }}
    />
  );
}
