import React, { useState, useEffect, useCallback } from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType, ID } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../boxEditors/BoxEditor";
import { useCanvasResize } from "./hooks/useEffect";
import { useCanvasRefs } from "./hooks/useRef";
import styles from "./styles/Canvas.module.css";
import CallStack from "./components/CallStack";
import MemoryModelEditorStyles from "../styles/MemoryModelEditor.module.css";

const editorMap: Record<BoxType["name"], React.FC<any>> = {
  primitive: BoxEditor,
  function: BoxEditor,
  list: BoxEditor,
  tuple: BoxEditor,
  set: BoxEditor,
  dict: BoxEditor,
  class: BoxEditor,
};

interface FloatingEditorProps {
  element: CanvasElement;
  Editor: React.FC<any>;
  onSave: (id: ID, kind: BoxType, invalidated?: boolean) => void;
  onRemove: () => void;
  onClose: () => void;
  onSelect: () => void;
  defaultPos: { x: number; y: number };
  ids: number[];
  addId: (id: number) => void;
  removeId: (id: ID) => void;
  classes?: string[];
  addClasses?: (className: string) => void;
  removeClasses?: (className: string) => void;
  sandbox: boolean;
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
  classes,
  addClasses,
  removeClasses,
  sandbox,
}: FloatingEditorProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      handle=".drag-handle"
      defaultPosition={defaultPos}
      onMouseDown={onSelect}
      bounds={`.${MemoryModelEditorStyles.column}`}
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
          classes={classes}
          addClasses={addClasses}
          removeClasses={removeClasses}
          sandbox={sandbox}
        />
      </div>
    </Draggable>
  );
}

interface CanvasProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  ids: number[];
  addId: (id: number) => void;
  removeId: (id: ID) => void;
  classes?: string[];
  addClasses?: (className: string) => void;
  removeClasses?: (className: string) => void;
  sandbox?: boolean;
}

export default function Canvas({
  elements,
  setElements,
  ids,
  addId,
  removeId,
  classes,
  addClasses,
  removeClasses,
  sandbox = true,
}: CanvasProps) {
  const [openBoxEditors, setOpenBoxEditors] = useState<CanvasElement[]>([]);
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const { svgRef } = useCanvasRefs();
  const [viewBox, setViewBox] = useState<string>("0 0 0 0");

  useCanvasResize(svgRef, setViewBox);
  useEffect(() => {
    if (sandbox) return;

    const elementIds = elements
      .filter((el) => el.kind.name !== "function" && typeof el.id === "number")
      .map((el) => el.id as number);

    elementIds.filter((id) => !ids.includes(id)).forEach((id) => addId(id));

    ids.filter((id) => !elementIds.includes(id)).forEach((id) => removeId(id));
  }, [elements, ids, sandbox, addId, removeId]);

  const makePositionUpdater = (boxId: number) => (x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.boxId === boxId ? { ...el, x, y } : el))
    );
  };

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: BoxType;

    switch (payload) {
      case "none":
        newKind = { name: "primitive", type: "None", value: "null" };
        break;
      case "int":
        newKind = { name: "primitive", type: "int", value: "0" };
        break;
      case "float":
        newKind = { name: "primitive", type: "float", value: "0.0" };
        break;
      case "str":
        newKind = { name: "primitive", type: "str", value: "" };
        break;
      case "bool":
        newKind = { name: "primitive", type: "bool", value: "false" };
        break;
      case "primitive":
        newKind = { name: "primitive", type: "None", value: "None" };
        break;
      case "function":
        const functionCount = elements.filter(
          (el) => el.kind.name === "function"
        ).length;
        newKind = {
          name: "function",
          type: "function",
          value: null,
          functionName: "__main__",
          params: [],
          order: functionCount + 1,
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
      case "class":
        newKind = {
          name: "class",
          type: "class",
          value: null,
          className: "NoClass",
          classVariables: [],
        };
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
      const boxIds = prev.map((el) => el.boxId as number).sort((a, b) => a - b);
      let newBoxId = boxIds.length;
      for (let i = 0; i < boxIds.length; i++) {
        if (boxIds[i] !== i) {
          newBoxId = i;
          break;
        }
      }

      let computedId: ID = "_";
      if (!sandbox && newKind.name !== "function") {
        const sortedPos = [...ids]
          .filter((n) => Number.isInteger(n) && n >= 1)
          .sort((a, b) => a - b);

        let computed = 1;
        for (let i = 0; i < sortedPos.length; i++) {
          const expected = i + 1;
          if (sortedPos[i] !== expected) {
            computed = expected;
            break;
          }
          computed = sortedPos.length + 1;
        }

        computedId = computed;
      }

      const newElement: CanvasElement = {
        boxId: newBoxId,
        id: computedId,
        kind: newKind,
        x: coords.x,
        y: coords.y,
      };
      return [...prev, newElement];
    });
  };

  // Now supports optional invalidate flag
  const saveElement = (
    boxId: number,
    updatedId: ID,
    updatedKind: BoxType,
    invalidated?: boolean
  ) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.boxId !== boxId) return el;

        const base = { ...el, id: updatedId, kind: updatedKind };

        if (invalidated !== undefined) {
          return { ...base, invalidated };
        }
        return base;
      })
    );
  };

  const removeElement = (boxId: number) => {
    setElements((prev) => prev.filter((el) => el.boxId !== boxId));
    setOpenBoxEditors((prev) => prev.filter((el) => el.boxId !== boxId));
    setSelected((prev) => (prev && prev.boxId === boxId ? null : prev));
  };

  const openElement = (canvasElement: CanvasElement) => {
    setOpenBoxEditors([canvasElement]);
    setSelected(canvasElement);
  };

  const functionFrames = elements.filter((el) => el.kind.name === "function");

  const handleReorder = useCallback(
    (from: number, to: number) => {
      if (from === to) return;

      setElements((prev) => {
        const funcIdxs = prev
          .map((el, i) => ({ el, i }))
          .filter(({ el }) => el.kind.name === "function");

        const fromIdx = funcIdxs[from].i;
        const toIdx = funcIdxs[to].i;

        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);

        const reorderedFuncs = next.filter((el) => el.kind.name === "function");
        const orderMap = new Map<number, number>();
        reorderedFuncs.forEach((func, idx) => {
          orderMap.set(func.boxId, idx + 1);
        });

        return next.map((el) => {
          if (el.kind.name === "function" && orderMap.has(el.boxId)) {
            return {
              ...el,
              kind: { ...el.kind, order: orderMap.get(el.boxId)! },
            };
          }
          return el;
        });
      });
    },
    [setElements]
  );

  return (
    <>
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
          <CallStack
            frames={functionFrames}
            selected={
              selected && selected.kind.name === "function" ? selected : null
            }
            onSelect={openElement}
            onReorder={handleReorder}
          />

          <g>
            {elements
              .filter((el) => el.kind.name !== "function")
              .map((el) => (
                <CanvasBox
                  key={el.boxId}
                  element={el}
                  openInterface={() => openElement(el)}
                  updatePosition={makePositionUpdater(el.boxId)}
                  invalidated={el.invalidated}
                />
              ))}
          </g>
        </svg>
      </div>

      {openBoxEditors.map((el) => {
        const Editor = editorMap[el.kind.name];
        return (
          <FloatingEditor
            key={el.boxId}
            element={el}
            Editor={Editor}
            defaultPos={{
              x: typeof window !== "undefined" ? window.innerWidth / 6.5 : 0,
              y: typeof window !== "undefined" ? window.innerHeight / 3 : 0,
            }}
            onSelect={() => setSelected(el)}
            onSave={(id, kind, invalidated) =>
              saveElement(el.boxId, id, kind, invalidated)
            }
            onRemove={() => removeElement(el.boxId)}
            onClose={() => {
              setOpenBoxEditors((prev) =>
                prev.filter((e) => e.boxId !== el.boxId)
              );
              setSelected((prev) =>
                prev && prev.boxId === el.boxId ? null : prev
              );
            }}
            ids={ids}
            addId={addId}
            removeId={removeId}
            classes={classes}
            addClasses={addClasses}
            removeClasses={removeClasses}
            sandbox={sandbox}
          />
        );
      })}
    </>
  );
}
