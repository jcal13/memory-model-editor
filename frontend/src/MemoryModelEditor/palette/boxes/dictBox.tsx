import rough from 'roughjs';
import React, { useEffect, useRef } from "react";

export default function DictBox() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/box-type", "set");
    e.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = 2;

    const mainX = 10 * scale;
    const mainY = 10 * scale;
    const mainWidth = 60 * scale;
    const mainHeight = 24 * scale;
    const doubleBoxPadding = 3 * scale;  

    // Main box
    rc.rectangle(
      mainX - doubleBoxPadding,
      mainY - doubleBoxPadding,
      mainWidth + 2 * doubleBoxPadding,
      mainHeight + 2 * doubleBoxPadding,
      {
        stroke: "#333",
        strokeWidth: 1,
        fill: "#fdf6e3",
        fillStyle: "solid",
      }
    );

    // ID box (top-left) 
    const idBoxWidth = 14 * scale;
    const idBoxHeight = 8 * scale;
    const idBoxX = mainX - 2 * scale - 1;
    const idBoxY = mainY - 2 * scale - 1; 

    rc.rectangle(idBoxX, idBoxY, idBoxWidth, idBoxHeight, {
      stroke: "#555",
      strokeWidth: 0.8,
      fill: "#fff",
      fillStyle: "solid",
    });

    ctx.font = `${7 * scale}px sans-serif`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("id", idBoxX + idBoxWidth / 2, idBoxY + idBoxHeight / 2);

    // Type box (top-right)
    const typeBoxWidth = 14 * scale;
    const typeBoxHeight = 8 * scale;
    const typeBoxX = mainX + mainWidth + 2 * scale - typeBoxWidth + 1;
    const typeBoxY = mainY - 2 * scale - 1;

    rc.rectangle(typeBoxX, typeBoxY, typeBoxWidth, typeBoxHeight, {
      stroke: "#555",
      strokeWidth: 0.8,
      fill: "#fff",
      fillStyle: "solid",
    });

    ctx.fillText("dict", typeBoxX + typeBoxWidth / 2, typeBoxY + typeBoxHeight / 2);

    // Draw two boxes and a colon in between
    const squareSize = 10 * scale;
    const gap = 6 * scale;

    const totalWidth = 2 * squareSize + gap;

    const startX = mainX + (mainWidth - totalWidth) / 2;
    const startY = mainY + (mainHeight - squareSize) / 2 + 5;

    // Left box (key)
    rc.rectangle(startX, startY, squareSize, squareSize, {
      stroke: "#000",
      strokeWidth: 0.5,
      fill: "#fff",
      fillStyle: "solid",
    });

    // Right box (value)
    rc.rectangle(startX + squareSize + gap, startY, squareSize, squareSize, {
      stroke: "#000",
      strokeWidth: 0.5,
      fill: "#fff",
      fillStyle: "solid",
    });

    // Colon in between
    ctx.font = `${squareSize}px monospace`;
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(":", startX + squareSize + gap / 2, startY + squareSize / 2);

    // Brackets around the boxes
    ctx.fillText("{", startX - 10, startY + squareSize / 2);
    ctx.fillText("}", startX + 2 * squareSize + gap + 10, startY + squareSize / 2);

  }, []);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        width: 160,
        height: 80,
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas ref={canvasRef} width={160} height={80} />
    </div>
  );
}
