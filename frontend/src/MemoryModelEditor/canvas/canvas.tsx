import React, { useState, useRef } from "react";
import { CanvasElement, ElementKind } from "../types";
import PrimitiveBoxCanvas from "./boxCanvasDisplays/primitveBoxCanvas";
import PrimitiveEditor from "./boxEditorDisplays/primitiveEditor";
import Draggable from "react-draggable";

// prevents overflow when dragging elements around the webpage
const html = document.documentElement;
html.style.overflowX = "hidden";

const editorMap: Record<string, React.FC<any>> = {
  primitive: PrimitiveEditor,
};

interface Props {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
}

export default function Canvas({ elements, setElements }: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const [dragTargetId, setDragTargetId] = useState<number | null>(null); // ← added
  const svgRef = useRef<SVGSVGElement>(null); // ← added
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();

    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: ElementKind;
    if (payload === "primitive") {
      newKind = {
        name: "primitive",
        type: "int",
        value: "null",
      };
    } else {
      return;
    }

    // find location on svg to place
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    // update elements
    setElements((prev) => [...prev, { id: prev.length, kind: newKind, x, y }]);
  };

  const moveDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragTargetId === null || !svgRef.current) return;

    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(
      svgRef.current.getScreenCTM()!.inverse()
    );

    setElements((prev) =>
      prev.map((el) => (el.id === dragTargetId ? { ...el, x, y } : el))
    );
  };

  const saveElement = (updatedKind: ElementKind) => {
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selected.id ? { ...el, kind: updatedKind } : el
      )
    );
    setSelected(null);
  };

  return (
    <>
      <svg
        ref={svgRef}
        width={800}
        height={600}
        style={{ border: "1px solid #000" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onMouseMove={moveDrag}
        onMouseUp={() => setDragTargetId(null)}
        onMouseLeave={() => setDragTargetId(null)}
      >
        {elements.map((el) =>
          el.kind.name === "primitive" ? (
            <PrimitiveBoxCanvas
              key={el.id}
              element={el}
              openPrimitiveInterface={() => setSelected(el)}
              beginDrag={(id) => setDragTargetId(id)}
            />
          ) : null
        )}
      </svg>

      {selected &&
        (() => {
          const Edit = editorMap[selected.kind.name];

          return (
            <Draggable
              handle=".drag-handle"
              defaultPosition={{ x: 400, y: 80 }}
              nodeRef={dragRef as React.RefObject<HTMLElement>}
            >
              <div
                ref={dragRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  backgroundColor: "red",
                }}
              >
                <Edit
                  element={selected}
                  onSave={saveElement}
                  onCancel={() => setSelected(null)}
                />
              </div>
            </Draggable>
          );
        })()}
    </>
  );
}
