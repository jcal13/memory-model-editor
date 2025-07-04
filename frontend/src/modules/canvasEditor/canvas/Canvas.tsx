import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType, ID } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../boxEditors/BoxEditor";
import { useCanvasResize } from "./hooks/useEffect";
import { useCanvasRefs } from "./hooks/useRef";
import styles from "./styles/Canvas.module.css";
import DownloadJsonButton from "./components/DownloadJsonButton";
import SubmitButton from "./components/SubmitButton";

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
  ids: number[];
  addId: (id: number) => void;
  removeId: (id: ID) => void;
  sandbox?: boolean;
}

function FloatingEditor({
  element,
  Editor,
  onSave,
  onRemove,
  onClose,
  onSelect,
  defaultPos,
  ids,
  addId,
  removeId,
  sandbox,
}: {
  element: CanvasElement;
  Editor: React.FC<any>;
  onSave: (id: ID, kind: BoxType) => void;
  onRemove: () => void;
  onClose: () => void;
  onSelect: () => void;
  defaultPos: { x: number; y: number };
  ids: number[];
  addId: (id: number) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
}) {
  const nodeRef = React.useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      handle=".drag-handle"
      defaultPosition={defaultPos}
      onMouseDown={onSelect}
    >
      <div ref={nodeRef} className={styles.editorContainer}>
        <Editor
          metadata={element}
          onSave={onSave}
          onRemove={onRemove}
          onClose={onClose}
          ids={ids}
          addId={addId}
          removeId={removeId}
          sandbox={sandbox}
        />
      </div>
    </Draggable>
  );
}

/* =======================================
   === Main Canvas Component ===
======================================= */
export default function Canvas({
  elements,
  setElements,
  ids,
  addId,
  removeId,
  sandbox = true,
}: Props) {
  const [openBoxEditors, setOpenBoxEditors] = useState<CanvasElement[]>([]);
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const { svgRef } = useCanvasRefs();
  const [viewBox, setViewBox] = useState<string>("0 0 0 0");

  useCanvasResize(svgRef, setViewBox);

  /* ---------------- Sync ids <-> elements (non-function only) ---------------- */
  useEffect(() => {
    if (sandbox) return;

    // Only numeric IDs coming from non-function boxes
    const elementIds = elements
      .filter((el) => el.kind.name !== "function" && typeof el.id === "number")
      .map((el) => el.id);

    // Newly added IDs
    elementIds.filter((id) => !ids.includes(id as number)).forEach((id) => addId(id as number));

    // Removed IDs
    ids.filter((id) => !elementIds.includes(id)).forEach((id) => removeId(id));
  }, [elements, ids, sandbox, addId, removeId]);

  /* ---------- Utility: updater for a specific box’s position ---------- */
  const makePositionUpdater = (boxId: number) => (x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.boxId === boxId ? { ...el, x, y } : el))
    );
  };

  /* --------------------- Handle Drag-and-Drop creation --------------------- */
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
          functionName: "__main__",
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

    setElements((prev) => {
    // find box id
    let newBoxId = prev.length;
    for (let i = 0; i < prev.length - 1; i++) {
      if (prev[i].boxId as number + 1 !== prev[i + 1].boxId) {
        newBoxId = prev[i].boxId as number + 1;
      }
    }
    

    // find compute id
    let computedId: ID = !sandbox && newKind.name !== "function" ? ids.length : "_";
    if (!sandbox) {
      for (let i = 0; i < ids.length - 1; i++) {
          if (ids[i] as number + 1 !== ids[i + 1]) {
              computedId = ids[i] as number + 1 ;
          }
        }
    }

      const newElement: CanvasElement = {
        boxId: newBoxId,
        id: computedId,
        kind: newKind,
        x: coords.x,
        y: coords.y,
      };
      const updated = [...prev, newElement];
      updated.sort((a, b) => (a.boxId as number) - (b.boxId as number));
      return updated;
    });
  };

  /* -------------- Update element after editor save -------------- */
  const saveElement = (
    boxId: number,
    updatedId: ID,
    updatedKind: BoxType
  ) => {
    setElements((prev) =>
      prev.map((el) =>
        el.boxId === boxId
          ? { ...el, id: updatedId, kind: updatedKind }
          : el
      )
    );
  };

  /* ----------------------- Remove element ----------------------- */
  const removeElement = (boxId: number) => {
    setElements((prev) => prev.filter((el) => el.boxId !== boxId));
    setOpenBoxEditors((prev) => prev.filter((el) => el.boxId !== boxId));
    setSelected((prev) => (prev && prev.boxId === boxId ? null : prev))
  };

  const openElement = (canvasElement: CanvasElement) => {
    setOpenBoxEditors((prev) =>
      prev.some((el) => el.boxId === canvasElement.boxId)
        ? prev
        : [...prev, canvasElement]
    );
    setSelected(canvasElement);  
  };

  return (
    <>
      {/* === SVG Canvas === */}
      <div className={styles.canvasWrapper}>
        <svg
          data-testid="canvas"
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
                openInterface={() => openElement(el)}
                updatePosition={makePositionUpdater(el.boxId)}
              />
            ))}
          </g>
        </svg>

      </div>

      {/* === Floating Box Editor Panels === */}
      {openBoxEditors.map(el => {
  const Editor = editorMap[el.kind.name];

  return (
    <FloatingEditor
      key={el.boxId}
      element={el}
      Editor={Editor}
      defaultPos={{
        x: typeof window !== "undefined" ? window.innerWidth / 4 : 0,
        y: typeof window !== "undefined" ? window.innerHeight / 4 : 0,
      }}
      onSelect={() => setSelected(el)}
      onSave={(id, kind) => saveElement(el.boxId, id, kind)}
      onRemove={() => removeElement(el.boxId)}
      onClose={() => {
        setOpenBoxEditors(prev => prev.filter(e => e.boxId !== el.boxId));
        setSelected(prev => (prev && prev.boxId === el.boxId ? null : prev));
      }}
      ids={ids}
      addId={addId}
      removeId={removeId}
      sandbox={sandbox}
    />
  );
})}
    </>
  );
}