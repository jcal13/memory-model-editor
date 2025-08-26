import React, { useState, useEffect, useRef, useCallback } from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType, ID } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../editors/boxEditor/BoxEditor";
import { useCanvasRefs } from "./hooks/useRef";
import styles from "./Canvas.module.css";
import CallStack from "./components/CallStack";
import MemoryModelEditorStyles from "../../MemoryModelEditor.module.css";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  const lastVB = useRef<string>("");

  useEffect(() => {
    const measure = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const h = Math.max(
        1,
        svg.clientHeight || Math.round(svg.getBoundingClientRect().height)
      );
      const w = Math.max(
        1,
        svg.clientWidth || Math.round(svg.getBoundingClientRect().width)
      );
      setFrozenHeight(h);
      const vb = `0 0 ${w} ${h}`;
      svg.setAttribute("viewBox", vb);
      lastVB.current = vb;
    };
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, [svgRef]);

  useEffect(() => {
    if (!frozenHeight) return;
    const svg = svgRef.current;
    if (!svg) return;

    let raf = 0;
    let prevW = -1;

    const updateWidth = () => {
      const w = Math.max(
        1,
        svg.clientWidth || Math.round(svg.getBoundingClientRect().width)
      );
      if (w !== prevW) {
        prevW = w;
        const vb = `0 0 ${w} ${frozenHeight}`;
        if (vb !== lastVB.current) {
          svg.setAttribute("viewBox", vb);
          lastVB.current = vb;
        }
      }
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateWidth);
    });

    ro.observe(svg);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [frozenHeight, svgRef]);

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
      case "function": {
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
      }
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

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const coords = pt.matrixTransform(ctm.inverse());

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
        if (invalidated !== undefined) return { ...base, invalidated };
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
      <div
        ref={wrapperRef}
        className={styles.canvasWrapper}
        style={{ overflowX: "hidden" }}
      >
        <svg
          data-testid="canvas"
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={styles.canvas}
          style={{
            width: "100%",
            height: frozenHeight ?? undefined,
            display: "block",
            padding: 0,
            border: 0,
            boxSizing: "content-box",
          }}
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
