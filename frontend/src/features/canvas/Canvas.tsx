import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import Draggable from "react-draggable";
import { CanvasElement, BoxType, ID } from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../editors/boxEditor/BoxEditor";
import CallStack from "./components/CallStack";
import { ClearCanvasButton, DownloadButton } from "./components/CanvasButtons";
import { useCanvasRefs } from "./hooks/hooks";
import { validateElements } from "./utils/validation";
import styles from "./Canvas.module.css";

const EDITOR_MAP: Record<BoxType["name"], React.FC<any>> = {
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
  defaultPosition: { x: number; y: number };
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
  defaultPosition,
  ids,
  addId,
  removeId,
  classes,
  addClasses,
  removeClasses,
  sandbox,
}: FloatingEditorProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      handle=".drag-handle"
      defaultPosition={defaultPosition}
      onMouseDown={onSelect}
      bounds={`.${styles.canvasWrapper}`}
      onStart={(e) => {
        e.stopPropagation();
        // Prevent text selection during drag
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
      }}
      onStop={() => {
        // Re-enable text selection after drag
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
      }}
    >
      <div ref={nodeRef} className={styles.floatingEditor}>
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
  onClear: () => void;
  onEditorOpenerReady?: (openEditor: (element: CanvasElement) => void) => void;
}

function Canvas({
  elements,
  setElements,
  ids,
  addId,
  removeId,
  classes,
  addClasses,
  removeClasses,
  sandbox = true,
  onClear,
  onEditorOpenerReady,
}: CanvasProps) {
  const [openEditors, setOpenEditors] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(
    null
  );
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

  const { svgRef } = useCanvasRefs();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initialVB =
    typeof window !== "undefined"
      ? `0 0 ${window.innerWidth} ${window.innerHeight}`
      : "0 0 1920 1080";

  const lastViewBox = useRef<string>(initialVB);

  // Canvas sizing and viewBox management (pre-paint to avoid flicker)
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const height = Math.max(1, rect.height);
    const width = Math.max(1, rect.width);
    setCanvasHeight(height);
    const viewBox = `0 0 ${width} ${height}`;
    if (viewBox !== lastViewBox.current) {
      svg.setAttribute("viewBox", viewBox);
      lastViewBox.current = viewBox;
    }
  }, [svgRef]);

  // Handle canvas width changes while preserving height
  useEffect(() => {
    if (!canvasHeight) return;

    const svg = svgRef.current;
    if (!svg) return;

    let animationFrame = 0;
    let previousWidth = -1;

    const updateWidth = () => {
      const width = Math.max(
        1,
        svg.clientWidth || svg.getBoundingClientRect().width
      );

      if (width !== previousWidth) {
        previousWidth = width;
        const viewBox = `0 0 ${width} ${canvasHeight}`;

        if (viewBox !== lastViewBox.current) {
          svg.setAttribute("viewBox", viewBox);
          lastViewBox.current = viewBox;
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateWidth);
    });

    resizeObserver.observe(svg);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [canvasHeight, svgRef]);

  // Sync element IDs in non-sandbox mode
  useEffect(() => {
    if (sandbox) return;

    const currentElementIds = elements
      .filter((el) => el.kind.name !== "function" && typeof el.id === "number")
      .map((el) => el.id as number);

    currentElementIds
      .filter((id) => !ids.includes(id))
      .forEach((id) => addId(id));

    ids
      .filter((id) => !currentElementIds.includes(id))
      .forEach((id) => removeId(id));
  }, [elements, ids, sandbox, addId, removeId]);

  // Validate elements whenever they change
  // Create a stable signature of elements for comparison
  const elementsSignature = useMemo(() => {
    return elements.map(el => 
      `${el.boxId}-${el.id}-${el.invalidated || false}-${typeof el.kind.value === 'object' ? JSON.stringify(el.kind.value) : el.kind.value}`
    ).join('|');
  }, [elements]);

  useEffect(() => {
    const validatedElements = validateElements(elements);
    
    // Check if any validation errors have changed
    const hasChanges = validatedElements.some((validatedEl, index) => {
      const currentEl = elements[index];
      if (!currentEl) return true;
      
      const validatedErrors = validatedEl.validationErrors;
      const currentErrors = currentEl.validationErrors;
      
      // Compare validation errors
      if (!validatedErrors && !currentErrors) return false;
      if (!validatedErrors || !currentErrors) return true;
      if (validatedErrors.length !== currentErrors.length) return true;
      
      return JSON.stringify(validatedErrors) !== JSON.stringify(currentErrors);
    });

    if (hasChanges) {
      setElements(validatedElements);
    }
  }, [elementsSignature]); // Only depend on the signature, not elements directly

  const createPositionUpdater = useCallback(
    (boxId: number) => (x: number, y: number) => {
      setElements((prev) =>
        prev.map((el) => (el.boxId === boxId ? { ...el, x, y } : el))
      );
    },
    [setElements]
  );

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent<SVGSVGElement>) => {
      event.preventDefault();
      const boxType = event.dataTransfer.getData("application/box-type");

      const newKind = createNewElement(boxType, elements);
      if (!newKind) return;

      const svg = svgRef.current;
      if (!svg) return;

      // Convert screen coordinates to SVG coordinates
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const coords = point.matrixTransform(ctm.inverse());

      setElements((prev) => {
        const newBoxId = getNextBoxId(prev);
        const newId =
          sandbox || newKind.name === "function" ? "_" : getNextElementId(ids);

        const newElement: CanvasElement = {
          boxId: newBoxId,
          id: newId,
          kind: newKind,
          x: coords.x,
          y: coords.y,
        };

        return [...prev, newElement];
      });
    },
    [elements, ids, sandbox, svgRef, setElements]
  );

  const saveElement = useCallback(
    (
      boxId: number,
      updatedId: ID,
      updatedKind: BoxType,
      invalidated?: boolean
    ) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.boxId !== boxId) return el;
          const updated = { ...el, id: updatedId, kind: updatedKind };
          return invalidated !== undefined
            ? { ...updated, invalidated }
            : updated;
        })
      );
    },
    [setElements]
  );

  const removeElement = useCallback(
    (boxId: number) => {
      setElements((prev) => prev.filter((el) => el.boxId !== boxId));
      setOpenEditors((prev) => prev.filter((el) => el.boxId !== boxId));
      setSelectedElement((prev) => (prev?.boxId === boxId ? null : prev));
    },
    [setElements]
  );

  const openElementEditor = useCallback((element: CanvasElement) => {
    setOpenEditors([element]);
    setSelectedElement(element);
  }, []);

  const closeElementEditor = useCallback((boxId: number) => {
    setOpenEditors((prev) => prev.filter((el) => el.boxId !== boxId));
    setSelectedElement((prev) => (prev?.boxId === boxId ? null : prev));
  }, []);

  // Expose the openElementEditor function to parent component
  useEffect(() => {
    if (onEditorOpenerReady) {
      onEditorOpenerReady(openElementEditor);
    }
  }, [onEditorOpenerReady, openElementEditor]);

  const functionFrames = elements.filter((el) => el.kind.name === "function");

  const handleCallStackReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      setElements((prev) => {
        const functionIndices = prev
          .map((el, i) => ({ el, i }))
          .filter(({ el }) => el.kind.name === "function");

        const sourceIndex = functionIndices[fromIndex].i;
        const targetIndex = functionIndices[toIndex].i;

        const reordered = [...prev];
        const [movedElement] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, movedElement);

        // Update order properties
        const reorderedFunctions = reordered.filter(
          (el) => el.kind.name === "function"
        );
        const orderMapping = new Map<number, number>();

        reorderedFunctions.forEach((func, index) => {
          orderMapping.set(func.boxId, index + 1);
        });

        return reordered.map((el) => {
          if (el.kind.name === "function" && orderMapping.has(el.boxId)) {
            return {
              ...el,
              kind: { ...el.kind, order: orderMapping.get(el.boxId)! },
            };
          }
          return el;
        });
      });
    },
    [setElements]
  );

  const defaultEditorPosition = {
    x: typeof window !== "undefined" ? window.innerWidth / 6.5 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 3 : 0,
  };

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
          viewBox={lastViewBox.current}
          preserveAspectRatio="none"
          className={styles.canvas}
          style={{
            width: "100%",
            height: canvasHeight ?? undefined,
            display: "block",
            padding: 0,
            border: 0,
            boxSizing: "content-box",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          <CallStack
            frames={functionFrames}
            selected={
              selectedElement?.kind.name === "function" ? selectedElement : null
            }
            onSelect={openElementEditor}
            onReorder={handleCallStackReorder}
          />

          <g>
            {elements
              .filter((el) => el.kind.name !== "function")
              .map((el) => (
                <CanvasBox
                  key={el.boxId}
                  element={el}
                  openInterface={() => openElementEditor(el)}
                  updatePosition={createPositionUpdater(el.boxId)}
                  invalidated={el.invalidated}
                />
              ))}
          </g>
        </svg>

        <ClearCanvasButton onClick={onClear} />
        <DownloadButton
          elements={elements}
          canvasSelector={`.${styles.canvasWrapper}`}
        />
      </div>

      {openEditors.map((element) => {
        const Editor = EDITOR_MAP[element.kind.name];
        return (
          <FloatingEditor
            key={element.boxId}
            element={element}
            Editor={Editor}
            defaultPosition={defaultEditorPosition}
            onSelect={() => setSelectedElement(element)}
            onSave={(id, kind, invalidated) =>
              saveElement(element.boxId, id, kind, invalidated)
            }
            onRemove={() => removeElement(element.boxId)}
            onClose={() => closeElementEditor(element.boxId)}
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

// Helper functions
function createNewElement(
  boxType: string,
  elements: CanvasElement[]
): BoxType | null {
  switch (boxType) {
    case "none":
      return { name: "primitive", type: "None", value: "null" };
    case "int":
      return { name: "primitive", type: "int", value: "0" };
    case "float":
      return { name: "primitive", type: "float", value: "0.0" };
    case "str":
      return { name: "primitive", type: "str", value: "" };
    case "bool":
      return { name: "primitive", type: "bool", value: "false" };
    case "primitive":
      return { name: "primitive", type: "None", value: "None" };
    case "function": {
      const functionCount = elements.filter(
        (el) => el.kind.name === "function"
      ).length;
      return {
        name: "function",
        type: "function",
        value: null,
        functionName: "__main__",
        params: [],
        order: functionCount + 1,
      };
    }
    case "list":
      return { name: "list", type: "list", value: [] };
    case "tuple":
      return { name: "tuple", type: "tuple", value: [] };
    case "set":
      return { name: "set", type: "set", value: [] };
    case "dict":
      return { name: "dict", type: "dict", value: {} };
    case "class":
      return {
        name: "class",
        type: "class",
        value: null,
        className: "NoClass",
        classVariables: [],
      };
    default:
      return null;
  }
}

function getNextBoxId(elements: CanvasElement[]): number {
  const boxIds = elements.map((el) => el.boxId as number).sort((a, b) => a - b);

  for (let i = 0; i < boxIds.length; i++) {
    if (boxIds[i] !== i) return i;
  }

  return boxIds.length;
}

function getNextElementId(ids: number[]): number {
  const sortedIds = [...ids]
    .filter((id) => Number.isInteger(id) && id >= 1)
    .sort((a, b) => a - b);

  for (let i = 0; i < sortedIds.length; i++) {
    const expected = i + 1;
    if (sortedIds[i] !== expected) return expected;
  }

  return sortedIds.length + 1;
}

const areEqual = (prev: Readonly<CanvasProps>, next: Readonly<CanvasProps>) => {
  return (
    prev.elements === next.elements &&
    prev.ids === next.ids &&
    prev.classes === next.classes &&
    prev.sandbox === next.sandbox
  );
};

export default memo(Canvas, areEqual);
