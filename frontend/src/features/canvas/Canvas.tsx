import { uiScale, screenToCanvas } from "../shared/uiScale";
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
import { getBoxDimensions } from "./utils/box.renderer";
import {
  getCallStackBounds,
  smoothlyConstrainDragPosition,
} from "./utils/boundary.helpers";
import {
  QUESTION_MAIN_FRAME_NAME,
  isLockedMainFrame,
  reorderFunctionFramesWithLockedMain,
} from "../memoryModelEditor/utils/questionFrames";
import styles from "./Canvas.module.css";
import { createElementsByIdMap } from "./utils/canvasReferences";
import { findOrphanedGeneratedPrimitiveIds } from "../editors/utils/pythonTutorInlinePrimitives";
import ReferenceArrows from "./components/ReferenceArrows";
import { inlineEditingEnabled } from "../inlineEditing/enabled";
import { useInlineEditing } from "../inlineEditing/useInlineEditing";
import { useCanvasKeyboard } from "./hooks/useCanvasKeyboard";
import { useGridLayout } from "./hooks/useGridLayout";
import { useKeyboardAdd } from "./hooks/useKeyboardAdd";
import ModelTextView from "./components/ModelTextView";
import { useAnnounceChanges } from "../a11y/useAnnounceChanges";

const MemoCanvasBox = memo(CanvasBox);

const NEW_BOX_BOUNDARY_DIMENSIONS = {
  width: 200,
  height: 110,
};

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
  canManageClasses?: boolean;
  canManageFunctions?: boolean;
  elements: CanvasElement[];
  editorScale: number;
  questionFunctionNames?: string[];
  isLockedMainFrame?: boolean;
  reservedFunctionNames?: string[];
  isQuestionMode?: boolean;
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
  canManageClasses,
  canManageFunctions,
  elements,
  editorScale,
  questionFunctionNames,
  isLockedMainFrame: lockMainFrame = false,
  reservedFunctionNames,
  isQuestionMode = false,
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
      scale={editorScale * uiScale()}
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
            canManageClasses={canManageClasses ?? sandbox}
            canManageFunctions={canManageFunctions ?? sandbox}
            elements={elements}
            questionFunctionNames={questionFunctionNames}
            isLockedMainFrame={lockMainFrame}
            reservedFunctionNames={reservedFunctionNames}
            isQuestionMode={isQuestionMode}
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
  canManageClasses?: boolean;
  canManageFunctions?: boolean;
  onClear: () => void;
  onEditorOpenerReady?: (openEditor: (element: CanvasElement) => void) => void;
  /** Receives a function that adds a box at the next free spot and focuses it. */
  onKeyboardAddReady?: (add: (boxType: string) => void) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  editorScale?: number;
  questionFunctionNames?: string[]; 
  visualStyle?: VisualStyle;
  pythonTutorReferenceArrows?: boolean;
  pythonTutorStandalonePrimitives?: boolean;
  /** Snap object boxes to a grid (see hooks/useGridLayout). */
  gridLayout?: boolean;
  /** Show the text outline of the model as a panel (it is always there for screen readers). */
  textView?: boolean;
  isQuestionMode?: boolean;
  preserveCollapsedWorkspace?: boolean;
  workspaceHeightOffset?: number;
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
  canManageClasses,
  canManageFunctions,
  onEditorOpenerReady,
  onKeyboardAddReady,
  scale: externalScale,
  onScaleChange,
  editorScale = 1,
  questionFunctionNames,
  visualStyle = "memoryviz",
  pythonTutorReferenceArrows = false,
  pythonTutorStandalonePrimitives = false,
  gridLayout = false,
  textView = false,
  isQuestionMode = false,
  preserveCollapsedWorkspace = false,
  workspaceHeightOffset = 0,
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
  const isProtectedMainFrame = useCallback(
    (element: CanvasElement) => isQuestionMode && isLockedMainFrame(element),
    [isQuestionMode]
  );

  const { svgRef } = useCanvasRefs();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const useInlinePythonTutorPrimitives =
    visualStyle === "pythonTutor" && !pythonTutorStandalonePrimitives;

  const constrainCanvasElementPosition = useCallback(
    (
      element: CanvasElement,
      x: number,
      y: number,
      dimensions?: { width: number; height: number },
    ) => {
      if (element.kind.name === "function") {
        return { x, y };
      }

      const svg = svgRef.current;
      const vb = svg?.viewBox.baseVal;

      if (!vb || !vb.width || !vb.height) {
        return { x, y };
      }

      const elementDimensions = dimensions ?? getBoxDimensions(element);

      const callStackBounds = getCallStackBounds(
        vb.height,
        0,
        0,
        callStackWidth,
      );

      return smoothlyConstrainDragPosition(
        { x, y },
        elementDimensions,
        callStackBounds,
        { width: vb.width, height: vb.height },
      );
    },
    [svgRef, callStackWidth],
  );

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

  const functionFrames = useMemo(
    () => elements.filter((el) => el.kind.name === "function"),
    [elements]
  );
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

  // Canvas sizing and viewBox management (pre-paint to avoid flicker)
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(1, rect.width / uiScale());
    const viewportHeight = Math.max(1, rect.height / uiScale());
    const renderedHeight = preserveCollapsedWorkspace
      ? Math.max(viewportHeight + workspaceHeightOffset, viewportHeight)
      : viewportHeight;
    setCanvasHeight(viewportHeight);
    baseDims.current = { width, height: renderedHeight };
    applyViewBox(width, renderedHeight, scale);
  }, [scale, applyViewBox, preserveCollapsedWorkspace, workspaceHeightOffset]);

  // Handle canvas size changes so vertical split panels can safely resize
  // the workspace without leaving the SVG on a stale height.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let animationFrame = 0;
    let previousWidth = -1;
    let previousHeight = -1;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(1, rect.width / uiScale());
      const viewportHeight = Math.max(1, rect.height / uiScale());
      const renderedHeight = preserveCollapsedWorkspace
        ? Math.max(viewportHeight + workspaceHeightOffset, viewportHeight)
        : viewportHeight;

      if (width !== previousWidth || renderedHeight !== previousHeight) {
        previousWidth = width;
        previousHeight = renderedHeight;
        setCanvasHeight(viewportHeight);
        baseDims.current = { width, height: renderedHeight };
        applyViewBox(width, renderedHeight, scale);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateSize);
    });

    resizeObserver.observe(wrapper);
    updateSize();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [scale, applyViewBox, preserveCollapsedWorkspace, workspaceHeightOffset]);

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

  // Close any floating editors whose element no longer exists
  // (e.g. when exiting a question clears the canvas, or an element is deleted)
  useEffect(() => {
    setOpenEditors((prev) => {
      const filtered = prev.filter((editor) =>
        elements.some((el) => el.boxId === editor.boxId)
      );
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [elements]);

  // Validate elements whenever they change
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
  }, [elements, setElements]);

  const createPositionUpdater = useCallback(
    (boxId: number) => (x: number, y: number) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.boxId !== boxId) return el;

          const constrained = constrainCanvasElementPosition(el, x, y);
          if (el.x === constrained.x && el.y === constrained.y) {
            return el;
          }

          return {
            ...el,
            x: constrained.x,
            y: constrained.y,
          };
        }),
      );
    },
    [setElements, constrainCanvasElementPosition],
  );

  // Late-bound: removeElement is declared further down.
  const removeElementRef = useRef<(boxId: number) => void>(() => {});
  const removeElementStable = useCallback(
    (boxId: number) => removeElementRef.current(boxId),
    []
  );

  // Inline editing in every mode and style. `sandbox` is true in Test mode
  // (no auto ids, no question-based hints) and false in Practice mode.
  const inlineEnabled = inlineEditingEnabled();

  const inline = useInlineEditing({
    enabled: inlineEnabled,
    wrapperRef,
    elements,
    setElements,
    addId,
    removeId,
    removeElement: removeElementStable,
    isProtected: isProtectedMainFrame,
    questionFunctionNames,
    reservedFunctionNames: isQuestionMode ? [QUESTION_MAIN_FRAME_NAME] : undefined,
    canManageFunctions: canManageFunctions ?? sandbox,
    classes,
    addClasses,
    canManageClasses: canManageClasses ?? sandbox,
    assisted: !sandbox,
    inlinePrimitives: useInlinePythonTutorPrimitives,
  });
  const inlineClick = inline.handleBoxClick;

  /** Add a box of `boxType` at a canvas position; returns its boxId. */
  const addBox = useCallback(
    (boxType: string, coords: { x: number; y: number }): number | null => {
      const primitiveBoxTypes = new Set([
        "none",
        "int",
        "float",
        "str",
        "bool",
        "primitive",
      ]);

      if (useInlinePythonTutorPrimitives && primitiveBoxTypes.has(boxType)) {
        return null;
      }

      const newKind = createNewElement(boxType);
      if (!newKind) return null;

      const newId =
        sandbox || newKind.name === "function" ? "_" : getNextElementId(ids);
      if (typeof newId === "number") addId(newId);

      if (inlineEnabled) {
        const newBoxId = getNextBoxId(elements);
        inline.select(newBoxId);
        if (newKind.name === "primitive" && newKind.type !== "NoneType" && newKind.type !== "bool") {
          inline.startEditByBoxId(newBoxId, { type: "value" });
        }
      }

      setElements((prev) => {
        const newBoxId = getNextBoxId(prev);

        const baseElement: CanvasElement = {
          boxId: newBoxId,
          id: newId,
          kind: newKind,
          x: coords.x,
          y: coords.y,
        };

        const constrained = constrainCanvasElementPosition(
          baseElement,
          coords.x,
          coords.y,
          NEW_BOX_BOUNDARY_DIMENSIONS,
        );

        const newElement: CanvasElement = {
          ...baseElement,
          x: constrained.x,
          y: constrained.y,
        };

        return [...prev, newElement];
      });
      return getNextBoxId(elements);
    },
    [
      elements,
      ids,
      sandbox,
      setElements,
      addId,
      useInlinePythonTutorPrimitives,
      inlineEnabled,
      inline,
      constrainCanvasElementPosition,
    ]
  );

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent<SVGSVGElement>) => {
      event.preventDefault();
      const boxType = event.dataTransfer.getData("application/box-type");
      const svg = svgRef.current;
      if (!svg) return;
      const coords = screenToCanvas(svg, event.clientX, event.clientY);
      if (!coords) return;
      addBox(boxType, coords);
    },
    [svgRef, addBox]
  );

  // ------------------------------------------------------------ keyboard
  const grid = useGridLayout({
    enabled: gridLayout,
    objects: visibleObjects,
    setElements,
    svgRef,
    callStackWidth,
    scale,
    onScaleChange,
  });
  const keyboardAdd = useKeyboardAdd({
    svgRef,
    gridLayout,
    firstFreeCell: grid.firstFreeCenter,
    addBox,
    inlinePrimitives: useInlinePythonTutorPrimitives,
    onKeyboardAddReady,
    // Runs from key handlers, after `keyboard` below exists.
    onAdded: (boxId) => keyboard.focusNewBox(boxId),
  });
  const keyboard = useCanvasKeyboard({
    enabled: inlineEnabled,
    svgRef,
    elements,
    select: inline.select,
    editFirstField: inline.editFirstField,
    moveTo: (boxId, x, y) => positionUpdaterRef.current(boxId)(x, y),
    gridMove: grid.move,
    editing: inline.editing,
    openAddPicker: keyboardAdd.openPicker,
    addSlot: inline.addSlotByBoxId,
  });
  useAnnounceChanges(elements, useInlinePythonTutorPrimitives);

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
          const nextKind =
            isProtectedMainFrame(el) && updatedKind.name === "function"
              ? {
                  ...updatedKind,
                  functionName: QUESTION_MAIN_FRAME_NAME,
                }
              : updatedKind;
          const updated = { ...el, id: updatedId, kind: nextKind };
          return invalidated !== undefined
            ? {
                ...updated,
                invalidated: isProtectedMainFrame(el) ? false : invalidated,
              }
            : updated;
        })
      );
    },
    [isProtectedMainFrame, setElements]
  );

  const removeElement = useCallback(
    (boxId: number) => {
      const removed = elements.find((el) => el.boxId === boxId);
      if (removed && isProtectedMainFrame(removed)) {
        return;
      }
      if (removed && typeof removed.id === "number") {
        removeId(removed.id);
      }
      setElements((prev) => prev.filter((el) => el.boxId !== boxId));
      setOpenEditors((prev) => prev.filter((el) => el.boxId !== boxId));
      setSelectedElement((prev) => (prev?.boxId === boxId ? null : prev));
    },
    [elements, isProtectedMainFrame, setElements, removeId]
  );


  removeElementRef.current = removeElement;

  const openElementEditor = useCallback(
    (element: CanvasElement, event?: MouseEvent) => {
      if (useInlinePythonTutorPrimitives && element.kind.name === "primitive") {
        return;
      }
      if (inlineEnabled) {
        inlineClick(element, event);
        return;
      }

      setOpenEditors([element]);
      setSelectedElement(element);
    },
    [useInlinePythonTutorPrimitives, inlineEnabled, inlineClick]
  );

  // Stable per-box callbacks: lets memoized boxes skip redrawing their SVG
  // when only overlay state (hover, selection) changes.
  const openEditorRef = useRef(openElementEditor);
  openEditorRef.current = openElementEditor;
  const positionUpdaterRef = useRef(createPositionUpdater);
  positionUpdaterRef.current = createPositionUpdater;
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const boxCallbacks = useRef(
    new Map<
      number,
      {
        open: (target: CanvasElement | null, event?: MouseEvent) => void;
        move: (x: number, y: number) => void;
      }
    >()
  );
  const getBoxCallbacks = (boxId: number) => {
    let cb = boxCallbacks.current.get(boxId);
    if (!cb) {
      cb = {
        open: (target, event) => {
          const el = target ?? elementsRef.current.find((e) => e.boxId === boxId);
          if (el) openEditorRef.current(el, event);
        },
        move: (x, y) => positionUpdaterRef.current(boxId)(x, y),
      };
      boxCallbacks.current.set(boxId, cb);
    }
    return cb;
  };
  const inlineSelectedFrame =
    inlineEnabled && inline.selectedElement?.kind.name === "function"
      ? inline.selectedElement
      : null;

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
      setOpenEditors([]);
      setSelectedElement(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openEditors.length]);

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

      setElements((prev) =>
        reorderFunctionFramesWithLockedMain(prev, fromIndex, toIndex)
      );
    },
    [setElements]
  );

  const defaultEditorPosition = {
    x: typeof window !== "undefined" ? window.innerWidth / 6.5 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 3 : 0,
  };

  return (
    <>
      <div className={styles.canvasRow}>
      <div
        ref={wrapperRef}
        className={styles.canvasWrapper}
        onMouseMove={inlineEnabled ? inline.onWrapperMouseMove : undefined}
        onMouseLeave={inlineEnabled ? inline.onWrapperMouseLeave : undefined}
        style={{
          overflowX: "hidden",
          overflowY: preserveCollapsedWorkspace ? "auto" : "hidden",
        }}
      >
        <svg
          data-testid="canvas"
          ref={svgRef}
          viewBox={lastViewBox.current}
          preserveAspectRatio="xMinYMin meet"
          className={styles.canvas}
          style={{
            width: "100%",
            height: preserveCollapsedWorkspace
              ? `${Math.max(
                  canvasHeight ?? 0,
                  (canvasHeight ?? 0) + workspaceHeightOffset
                )}px`
              : "100%",
            minHeight: canvasHeight ?? undefined,
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
              inlineEnabled
                ? inlineSelectedFrame
                : selectedElement?.kind.name === "function"
                ? selectedElement
                : null
            }
            onSelect={openElementEditor}
            onFieldPointerDown={inlineEnabled ? inline.claimPointerDown : undefined}
            onReorder={handleCallStackReorder}
            onWidthChange={setCallStackWidth}
            scale={scale}
            canvasHeight={canvasHeight ?? undefined}
            visualStyle={visualStyle}
            pythonTutorReferenceArrows={pythonTutorReferenceArrows}
            pythonTutorStandalonePrimitives={
              pythonTutorStandalonePrimitives
            }
            elementsById={elementsById}
          />

          <g>
            {visibleObjects.map((el) => (
                <MemoCanvasBox
                  key={el.boxId}
                  element={el}
                  openInterface={getBoxCallbacks(el.boxId).open}
                  updatePosition={getBoxCallbacks(el.boxId).move}
                  onFieldPointerDown={inlineEnabled ? inline.claimPointerDown : undefined}
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

          <ReferenceArrows
            svgRef={svgRef}
            enabled={pythonTutorReferenceArrows}
            includePrimitiveTargets={visualStyle !== "pythonTutor" || pythonTutorStandalonePrimitives}
            sources={visualStyle === "pythonTutor" ? "markers" : "slots"}
            elements={elements}
          />
        </svg>
        {inline.layer}
        {keyboardAdd.picker}
      </div>
      <ModelTextView
        elements={elements}
        inlinePrimitives={useInlinePythonTutorPrimitives}
        visible={textView}
        onFocusBox={(boxId) => {
          keyboard.setCurrent(boxId);
          keyboard.focusBox(boxId);
        }}
      />
      </div>

      {openEditors.map((openedElement) => {
        const element = elements.find(item => item.boxId === openedElement.boxId);
        if (!element) return null;
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
            canManageClasses={canManageClasses ?? sandbox}
            canManageFunctions={canManageFunctions ?? sandbox}
            elements={elements}
            editorScale={editorScale}
            questionFunctionNames={questionFunctionNames}
            isLockedMainFrame={isProtectedMainFrame(element)}
            reservedFunctionNames={
              isQuestionMode ? [QUESTION_MAIN_FRAME_NAME] : undefined
            }
            isQuestionMode={isQuestionMode}
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
    prev.gridLayout === next.gridLayout &&
    prev.textView === next.textView &&
    prev.pythonTutorStandalonePrimitives ===
      next.pythonTutorStandalonePrimitives
  );
};

export default memo(Canvas, areEqual);
