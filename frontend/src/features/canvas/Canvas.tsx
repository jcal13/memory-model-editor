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
import {
  CanvasElement,
  BoxType,
  ID,
  VisualStyle,
} from "../shared/types";
import CanvasBox from "./components/CanvasBox";
import BoxEditor from "../editors/boxEditor/BoxEditor";
import CallStack from "./components/CallStack";
import { useCanvasRefs } from "./hooks/useCanvas";
import { validateElements } from "./utils/validation";
import styles from "./Canvas.module.css";
import {
  createElementsByIdMap,
} from "./utils/pythonTutorReferences";
import { findOrphanedGeneratedPrimitiveIds } from "../editors/utils/pythonTutorInlinePrimitives";
import PythonTutorReferenceArrows from "./components/PythonTutorReferenceArrows";

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
  elements: CanvasElement[];
  editorScale: number;
  questionFunctionNames?: string[];
  visualStyle?: VisualStyle;
  pythonTutorReferenceArrows?: boolean;
  pythonTutorStandalonePrimitives?: boolean;
  onElementsChange: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
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
  elements,
  editorScale,
  questionFunctionNames,
  visualStyle = "memoryviz",
  pythonTutorReferenceArrows = false,
  pythonTutorStandalonePrimitives = false,
  onElementsChange,
}: FloatingEditorProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      handle=".drag-handle"
      defaultPosition={defaultPosition}
      onMouseDown={onSelect}
      bounds={`.${styles.canvasWrapper}`}
      scale={editorScale}
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
        <div
          style={{
            transform: `scale(${editorScale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
        >
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
            elements={elements}
            questionFunctionNames={questionFunctionNames}
            visualStyle={visualStyle}
            pythonTutorStandalonePrimitives={pythonTutorStandalonePrimitives}
            onElementsChange={onElementsChange}
          />
        </div>
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
  scale?: number;
  onScaleChange?: (scale: number) => void;
  editorScale?: number;
  questionFunctionNames?: string[]; 
  visualStyle?: VisualStyle;
  pythonTutorReferenceArrows?: boolean;
  pythonTutorStandalonePrimitives?: boolean;
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
  onEditorOpenerReady,
  scale: externalScale,
  editorScale = 1,
  questionFunctionNames,
  visualStyle = "memoryviz",
  pythonTutorReferenceArrows = false,
  pythonTutorStandalonePrimitives = false,
}: CanvasProps) {
  const [openEditors, setOpenEditors] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(
    null
  );
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);
  const [internalScale] = useState(1);
  const [callStackWidth, setCallStackWidth] = useState(225);

  // Use external scale if provided, otherwise use internal
  const scale = externalScale !== undefined ? externalScale : internalScale;

  const { svgRef } = useCanvasRefs();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const useInlinePythonTutorPrimitives =
    visualStyle === "pythonTutor" && !pythonTutorStandalonePrimitives;

  const initialVB =
    typeof window !== "undefined"
      ? `0 0 ${window.innerWidth} ${window.innerHeight}`
      : "0 0 1920 1080";

  const lastViewBox = useRef<string>(initialVB);
  const baseDims = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Recompute the viewBox from base dims + current scale
  const applyViewBox = useCallback(
    (w: number, h: number, s: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const vb = `0 0 ${w / s} ${h / s}`;
      if (vb !== lastViewBox.current) {
        svg.setAttribute("viewBox", vb);
        lastViewBox.current = vb;
      }
    },
    [svgRef]
  );

  // Canvas sizing and viewBox management (pre-paint to avoid flicker)
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const height = Math.max(1, rect.height);
    const width = Math.max(1, rect.width);
    setCanvasHeight(height);
    baseDims.current = { width, height };
    applyViewBox(width, height, scale);
  }, [svgRef, scale, applyViewBox]);

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
        baseDims.current = { width, height: canvasHeight };
        applyViewBox(width, canvasHeight, scale);
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
  }, [canvasHeight, svgRef, scale, applyViewBox]);

  // Re-apply viewBox when scale changes
  useEffect(() => {
    const { width, height } = baseDims.current;
    if (width > 0 && height > 0) {
      // Force immediate update
      requestAnimationFrame(() => {
        applyViewBox(width, height, scale);
      });
    }
  }, [scale, applyViewBox]);

  useEffect(() => {
    if (sandbox) return;

    const currentElementIds = elements
      .filter((el) => el.kind.name !== "function" && typeof el.id === "number")
      .map((el) => el.id as number);

    currentElementIds
      .filter((id) => !ids.includes(id))
      .forEach((id) => addId(id));
  }, [elements, ids, sandbox, addId]);

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
      
      const validatedErrors = validatedEl.errors;
      const currentErrors = currentEl.errors;
      
      // Compare errors
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
      const primitiveBoxTypes = new Set([
        "none",
        "int",
        "float",
        "str",
        "bool",
        "primitive",
      ]);

      if (useInlinePythonTutorPrimitives && primitiveBoxTypes.has(boxType)) {
        return;
      }

      const newKind = createNewElement(boxType);
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
    [
      elements,
      ids,
      sandbox,
      svgRef,
      setElements,
      useInlinePythonTutorPrimitives,
    ]
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
      const removed = elements.find((el) => el.boxId === boxId);
      if (removed && typeof removed.id === "number") {
        removeId(removed.id);
      }
      setElements((prev) => prev.filter((el) => el.boxId !== boxId));
      setOpenEditors((prev) => prev.filter((el) => el.boxId !== boxId));
      setSelectedElement((prev) => (prev?.boxId === boxId ? null : prev));
    },
    [elements, setElements, removeId]
  );

  const openElementEditor = useCallback(
    (element: CanvasElement) => {
      if (useInlinePythonTutorPrimitives && element.kind.name === "primitive") {
        return;
      }

      setOpenEditors([element]);
      setSelectedElement(element);
    },
    [useInlinePythonTutorPrimitives]
  );

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

  useEffect(() => {
    if (!useInlinePythonTutorPrimitives) {
      return;
    }

    setOpenEditors((prev) =>
      prev.filter((element) => element.kind.name !== "primitive")
    );
    setSelectedElement((prev) =>
      prev?.kind.name === "primitive" ? null : prev
    );
  }, [useInlinePythonTutorPrimitives]);

  // Close all open editors when Escape is pressed
  useEffect(() => {
    if (openEditors.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      setOpenEditors([]);
      setSelectedElement(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openEditors.length]);

  const functionFrames = elements.filter((el) => el.kind.name === "function");
  const elementsById = useMemo(() => createElementsByIdMap(elements), [elements]);
  const visibleObjects = useMemo(
    () =>
      elements.filter((el) => {
        if (el.kind.name === "function") return false;
        return !(
          useInlinePythonTutorPrimitives && el.kind.name === "primitive"
        );
      }),
    [elements, useInlinePythonTutorPrimitives]
  );

  useEffect(() => {
    if (!useInlinePythonTutorPrimitives) {
      return;
    }

    const orphanedGeneratedPrimitiveIds = findOrphanedGeneratedPrimitiveIds(elements);
    if (orphanedGeneratedPrimitiveIds.length === 0) {
      return;
    }

    orphanedGeneratedPrimitiveIds.forEach((id) => removeId(id));
    setElements((prev) =>
      prev.filter(
        (element) =>
          !(
            element.kind.name === "primitive" &&
            element.generatedInlinePrimitive &&
            typeof element.id === "number" &&
            orphanedGeneratedPrimitiveIds.includes(element.id)
          )
      )
    );
    setOpenEditors((prev) =>
      prev.filter(
        (element) =>
          !(
            element.kind.name === "primitive" &&
            typeof element.id === "number" &&
            orphanedGeneratedPrimitiveIds.includes(element.id)
          )
      )
    );
    setSelectedElement((prev) => {
      if (
        prev &&
        prev.kind.name === "primitive" &&
        typeof prev.id === "number" &&
        orphanedGeneratedPrimitiveIds.includes(prev.id)
      ) {
        return null;
      }

      return prev;
    });
  }, [elements, removeId, setElements, useInlinePythonTutorPrimitives]);

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

        return reordered;
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
          preserveAspectRatio="xMinYMin meet"
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
            onWidthChange={setCallStackWidth}
            scale={scale}
            visualStyle={visualStyle}
            pythonTutorReferenceArrows={pythonTutorReferenceArrows}
            pythonTutorStandalonePrimitives={
              pythonTutorStandalonePrimitives
            }
            elementsById={elementsById}
          />

          <g>
            {visibleObjects.map((el) => (
                <CanvasBox
                  key={el.boxId}
                  element={el}
                  openInterface={(target) => openElementEditor(target ?? el)}
                  updatePosition={createPositionUpdater(el.boxId)}
                  invalidated={el.invalidated}
                  callStackWidth={callStackWidth}
                  visualStyle={visualStyle}
                  pythonTutorReferenceArrows={pythonTutorReferenceArrows}
                  pythonTutorStandalonePrimitives={
                    pythonTutorStandalonePrimitives
                  }
                  elementsById={elementsById}
                />
              ))}
          </g>

          <PythonTutorReferenceArrows
            svgRef={svgRef}
            enabled={
              visualStyle === "pythonTutor" && pythonTutorReferenceArrows
            }
            includePrimitiveTargets={pythonTutorStandalonePrimitives}
            elements={elements}
          />
        </svg>
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
            elements={elements}
            editorScale={editorScale}
            questionFunctionNames={questionFunctionNames}
            visualStyle={visualStyle}
            pythonTutorReferenceArrows={pythonTutorReferenceArrows}
            pythonTutorStandalonePrimitives={pythonTutorStandalonePrimitives}
            onElementsChange={setElements}
          />
        );
      })}
    </>
  );
}

// Helper functions
function createNewElement(boxType: string): BoxType | null {
  switch (boxType) {
    case "none":
      return { name: "primitive", type: "NoneType", value: "None" };
    case "int":
      return { name: "primitive", type: "int", value: "0" };
    case "float":
      return { name: "primitive", type: "float", value: "0.0" };
    case "str":
      return { name: "primitive", type: "str", value: "" };
    case "bool":
      return { name: "primitive", type: "bool", value: "false" };
    case "primitive":
      return { name: "primitive", type: "NoneType", value: "None" };
    case "function":
      return {
        name: "function",
        type: "function",
        value: null,
        functionName: "NoFunction",
        params: [],
      };
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
    prev.sandbox === next.sandbox &&
    prev.scale === next.scale &&
    prev.editorScale === next.editorScale &&
    prev.questionFunctionNames === next.questionFunctionNames &&
    prev.visualStyle === next.visualStyle &&
    prev.pythonTutorReferenceArrows === next.pythonTutorReferenceArrows &&
    prev.pythonTutorStandalonePrimitives ===
      next.pythonTutorStandalonePrimitives
  );
};

export default memo(Canvas, areEqual);
