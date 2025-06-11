import React, { useState } from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../boxEditors/BoxEditor";
import { useCanvasResize } from "./hooks/useEffect";
import { useCanvasRefs } from "./hooks/useRef";
import styles from "./styles/Canvas.module.css";

const editorMap: Record<BoxType["name"], React.FC<any>> = {
  primitive: BoxEditor,
  function: BoxEditor,
  list: BoxEditor,
  tuple: BoxEditor,
  set: BoxEditor,
  dict: BoxEditor,
};

interface Props {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
}

export default function Canvas({ elements, setElements }: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const { svgRef, dragRef } = useCanvasRefs();
  const [viewBox, setViewBox] = useState<string>("0 0 0 0");

  useCanvasResize(svgRef, setViewBox);

  const makePositionUpdater =
    (id: string | number) => (x: number, y: number) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x, y } : el))
      );
    };

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: BoxType;

    switch (payload) {
      case "primitive":
        newKind = { name: "primitive", type: "None", value: "None" };
        break;
      case "function":
        newKind = {
          name: "function",
          type: "function",
          value: null,
          functionName: "myFunction",
          params: [],
        };
        break;
      case "list":
        newKind = { name: "list", type: "list", value: [] };
        break;
      case "tuple":
        newKind = { name: "tuple", type: "tuple", value: [] };
        break;
      case "set":
        newKind = { name: "set", type: "set", value: [] };
        break;
      case "dict":
        newKind = { name: "dict", type: "dict", value: {} };
        break;
      default:
        return;
    }

    const pt = svgRef.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const coords = pt.matrixTransform(
      svgRef.current!.getScreenCTM()!.inverse()
    );

    setElements((prev) => [
      ...prev,
      { id: prev.length, kind: newKind, x: coords.x, y: coords.y },
    ]);
  };

  const saveElement = (updatedKind: BoxType) => {
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selected.id ? { ...el, kind: updatedKind } : el
      )
    );
    setSelected(null);
  };

  const removeElement = () => {
    if (!selected) return;
    setElements((prev) => prev.filter((el) => el.id !== selected.id));
    setSelected(null);
  };

  return (
    <>
      <div className={styles.canvasWrapper}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMinYMin meet"
          className={styles.canvas}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <g>
            {elements.map((el) => (
              <CanvasBox
                key={el.id}
                element={el}
                openInterface={() => setSelected(el)}
                updatePosition={makePositionUpdater(el.id)}
              />
            ))}
          </g>
        </svg>
      </div>

      {selected && (
        <Draggable
          nodeRef={dragRef as React.RefObject<HTMLElement>}
          handle=".drag-handle"
          defaultPosition={{
            x: typeof window !== "undefined" ? window.innerWidth / 4 : 0,
            y: typeof window !== "undefined" ? window.innerHeight / 4 : 0,
          }}
        >
          <div ref={dragRef} className={styles.editorContainer}>
            {(() => {
              const Editor = editorMap[selected.kind.name];
              return (
                <Editor
                  metadata={selected}
                  onSave={saveElement}
                  onRemove={removeElement}
                />
              );
            })()}
          </div>
        </Draggable>
      )}
    </>
  );
}
