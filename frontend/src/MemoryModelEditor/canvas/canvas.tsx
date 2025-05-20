import React, { useState } from "react";
import { CanvasElement, ElementKind } from "../types";
import PrimitiveBoxCanvas from "./boxCanvasDisplays/primitveBoxCanvas";
import PrimitiveEditor from "./boxEditorDisplays/primitiveEditor";

const editorMap: Record<string, React.FC<any>> = {
  primitive: PrimitiveEditor,
};

interface Props {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
}

export default function Canvas({ elements, setElements }: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);

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
        width={800}
        height={600}
        style={{ border: "1px solid #000" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {elements.map((el) =>
          el.kind.name === "primitive" ? (
            <PrimitiveBoxCanvas
              key={el.id}
              element={el}
              openPrimitiveInterface={() => setSelected(el)}
            />
          ) : null
        )}
      </svg>

      {selected &&
        (() => {
          const Edit = editorMap[selected.kind.name];
          return (
            <Edit
              element={selected}
              onSave={saveElement}
              onCancel={() => setSelected(null)}
            />
          );
        })()}
    </>
  );
}
