import React, { useState } from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType, ID } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../boxEditors/BoxEditor";
import { useCanvasResize } from "./hooks/useEffect";
import { useCanvasRefs } from "./hooks/useRef";
import styles from "./styles/Canvas.module.css";

/* =======================================
   === Box Editor Mapping by Type Name ===
======================================= */
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
  ids: ID[];
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
}

/* =======================================
   === Main Canvas Component ===
======================================= */
export default function Canvas({ elements, setElements, ids, addId, removeId}: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const { svgRef, dragRef } = useCanvasRefs();
  const [viewBox, setViewBox] = useState<string>("0 0 0 0");

  useCanvasResize(svgRef, setViewBox);

  /* === Utility: Creates updater function for a specific box ID === */
  const makePositionUpdater =
    (boxId: number) => (x: number, y: number) => {
      setElements((prev) =>
        prev.map((el) => (el.boxId === boxId ? { ...el, x, y } : el))
      );
    };

  /* === Handle Drag & Drop Creation of New Elements === */
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
      { boxId: prev.length, id: "None", kind: newKind, x: coords.x, y: coords.y },
    ]);
  };

  /* === Update element after editor save === */
  const saveElement = (updatedId: ID, updatedKind: BoxType) => {
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) =>
        el.boxId === selected.boxId ? { ...el, id: updatedId, kind: updatedKind } : el
      )
    );
    setSelected(null);
  };

  /* === Remove element from canvas === */
  const removeElement = () => {
    if (!selected) return;
    setElements((prev) => prev.filter((el) => el.boxId !== selected.boxId));
    setSelected(null);
  };

  /* === Render === */
  return (
    <>
      {/* === SVG Canvas === */}
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
                key={el.boxId}
                element={el}
                openInterface={() => setSelected(el)}
                updatePosition={makePositionUpdater(el.boxId)}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* === Floating Box Editor Panel === */}
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
                  ids={ids}
                  addId={addId}
                  removeId={removeId}
                />
              );
            })()}
          </div>
        </Draggable>
      )}
    </>
  );
}
