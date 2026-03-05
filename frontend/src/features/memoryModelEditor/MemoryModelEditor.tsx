import Canvas from "../canvas/Canvas";
import Palette from "../palette/Palette";
import ConfirmationModal from "./components/ConfirmationModal";
import InformationTabs from "../informationTabs/InformationTabs";
import PanelToggleButtons from "./components/PanelToggleButtons";
import styles from "./MemoryModelEditor.module.css";
import { useResponsivePanels } from "./hooks/useResponsivePanels";

import {
  useMemoryModelEditorState,
  clearCanvasStorage,
} from "./hooks/useMemoryModelEditorState";
import { loadInitialUIData } from "./utils/localStorage";
import { useMemoryModelEditorRefs } from "./hooks/useRef";
import {
  useCanvasLocalStorage,
  useUILocalStorage,
} from "./hooks/useLocalStorage";
import { useCanvasSubmission } from "./hooks/useCanvasSubmission";
import { useUndoHistory } from "./hooks/useUndoHistory";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { CanvasElement, BoxTypeName } from "../shared/types";
import {
  createMasterErrorList,
  MasterErrorList,
} from "./utils/masterErrorList";
import { spreadOverlappingElements } from "../canvas/utils/boundary.helpers";

// Layout constants
const MAX_INFO_PANEL_VIEWPORT_RATIO = 0.6667;
const MAX_INFO_PANEL_CSS_WIDTH = `${MAX_INFO_PANEL_VIEWPORT_RATIO * 100}vw`;
const MIN_PALETTE_WIDTH = 200;
const MAX_PALETTE_WIDTH = 400;
const DEFAULT_PALETTE_WIDTH = 280;
const SNAP_CLOSE_THRESHOLD = 100;

interface MemoryModelEditorProps {
  sandbox?: boolean;
}

export default function MemoryModelEditor({
  sandbox = true,
}: MemoryModelEditorProps) {
  const state = useMemoryModelEditorState(sandbox);
  const refs = useMemoryModelEditorRefs();
  const [openEditor, setOpenEditor] = useState<
    ((element: CanvasElement) => void) | null
  >(null);

  const [paletteWidth, setPaletteWidth] = useState<number>(
    DEFAULT_PALETTE_WIDTH
  );
  const [isResizingPalette, setIsResizingPalette] = useState<boolean>(false);
  const [tempPaletteWidth, setTempPaletteWidth] = useState<number>(
    DEFAULT_PALETTE_WIDTH
  );

  const [currentQuestionData, setCurrentQuestionData] = useState<any>(null);
  const _initialUI = loadInitialUIData();
  const [canvasScale, setCanvasScale] = useState<number>(_initialUI.canvasScale ?? 1);
  const [editorScale, setEditorScale] = useState<number>(_initialUI.editorScale ?? 1);
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem("questionFontScale");
    return saved ? parseFloat(saved) : 1;
  });
  const adjustFontScale = (delta: number) => {
    setFontScale((prev) => {
      const next = Math.max(0.75, Math.min(1.5, Math.round((prev + delta) * 10) / 10));
      localStorage.setItem("questionFontScale", String(next));
      return next;
    });
  };

  // Initialize undo history
  const { canUndo, canRedo, undo, redo, recordState, clearHistory } = useUndoHistory(
    state.setElements,
    state.setElementIds,
    state.setElementClasses
  );

  // Track previous state for recording changes
  const prevStateRef = useRef({
    elements: state.elements,
    ids: state.elementIds,
    classes: state.elementClasses,
  });

  const handleEditorOpenerReady = useCallback(
    (opener: (element: CanvasElement) => void) => {
      setOpenEditor(() => opener);
    },
    []
  );

  // Record state changes for undo functionality
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = {
      elements: state.elements,
      ids: state.elementIds,
      classes: state.elementClasses,
    };

    // Check if state has actually changed
    const hasChanged =
      JSON.stringify(prevState.elements) !== JSON.stringify(currentState.elements) ||
      JSON.stringify(prevState.ids) !== JSON.stringify(currentState.ids) ||
      JSON.stringify(prevState.classes) !== JSON.stringify(currentState.classes);

    if (hasChanged) {
      // Record the current state (after the change)
      recordState(currentState);
      prevStateRef.current = currentState;
    }
  }, [state.elements, state.elementIds, state.elementClasses, recordState]);

  const clearCanvas = () => {
    state.setElements([]);
    state.setElementIds([]);
    state.setElementClasses([]);
    state.setSelectedQuestionIndex(null);
    state.setSelectedQuestionType(null);
    state.setSubmissionResults(null);
    state.setActiveInfoTab("question");
    state.setCanvasResetKey((prev) => prev + 1);
    clearCanvasStorage();
    clearHistory();
  };

  const restoreCanvas = (
    elements: CanvasElement[],
    ids: number[],
    classes: string[]
  ) => {
    state.setElements(spreadOverlappingElements(elements));
    state.setElementIds(ids);
    state.setElementClasses(classes);
    clearHistory();
  };

  // When a question loads in practice mode, seed elementClasses with the class names
  // from the question's answer so the class selector shows them as pre-built options.
  useEffect(() => {
    if (!state.isSandboxMode || !currentQuestionData) return;
    const questionClassNames = getQuestionClassNames(currentQuestionData);
    if (questionClassNames.length === 0) return;
    state.setElementClasses((prev) => {
      const merged = [...prev];
      for (const name of questionClassNames) {
        if (!merged.includes(name)) {
          merged.push(name);
        }
      }
      return merged;
    });
  }, [currentQuestionData, state.isSandboxMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const masterErrorList: MasterErrorList = useMemo(
    () => createMasterErrorList(state.elements),
    [state.elements]
  );

  const addElementId = (id: number): void => {
    state.setElementIds((prevIds) => {
      const insertIndex = prevIds.findIndex((existingId) => existingId > id);
      return insertIndex === -1
        ? [...prevIds, id]
        : [...prevIds.slice(0, insertIndex), id, ...prevIds.slice(insertIndex)];
    });
  };

  const removeElementId = (id: number | "_"): void => {
    if (typeof id === "number") {
      state.setElementIds((prevIds) =>
        prevIds.filter((existingId) => existingId !== id)
      );
    }
  };

  const addElementClass = (className: string): void => {
    state.setElementClasses((prevClasses) => {
      if (prevClasses.includes(className)) return prevClasses;
      const insertIndex = prevClasses.findIndex(
        (existingClass) => existingClass.localeCompare(className) > 0
      );
      return insertIndex === -1
        ? [...prevClasses, className]
        : [
            ...prevClasses.slice(0, insertIndex),
            className,
            ...prevClasses.slice(insertIndex),
          ];
    });
  };

  const removeElementClass = (className: string): void => {
    state.setElementClasses((prevClasses) =>
      prevClasses.filter((existingClass) => existingClass !== className)
    );
  };

  const getQuestionFunctionNames = useCallback((questionData: any): string[] => {
    if (!questionData?.answer || !Array.isArray(questionData.answer)) {
      return [];
    }
    return questionData.answer
      .filter((box: any) => box.type === ".frame" && typeof box.name === "string")
      .map((box: any) => box.name as string);
  }, []);

  const getQuestionClassNames = useCallback((questionData: any): string[] => {
    if (!questionData?.answer || !Array.isArray(questionData.answer)) {
      return [];
    }
    const seen = new Set<string>();
    const names: string[] = [];
    for (const box of questionData.answer) {
      if (
        (box.type === ".class" || box.type === "object") &&
        typeof box.name === "string"
      ) {
        if (!seen.has(box.name)) {
          seen.add(box.name);
          names.push(box.name);
        }
      }
    }
    return names;
  }, []);

  const getRequiredBoxTypeNames = useCallback((questionData: any): BoxTypeName[] => {
    if (!questionData?.answer || !Array.isArray(questionData.answer)) {
      return [];
    }

    const requiredTypes = new Set<BoxTypeName>();

    const hasFrames = questionData.answer.some(
      (box: any) => box.type === ".frame"
    );
    if (hasFrames) {
      requiredTypes.add("function" as BoxTypeName);
    }

    questionData.answer.forEach((box: any) => {
      const boxType = box.type;

      switch (boxType) {
        case ".frame":
          break;
        case "int":
          requiredTypes.add("int" as BoxTypeName);
          break;
        case "float":
          requiredTypes.add("float" as BoxTypeName);
          break;
        case "str":
          requiredTypes.add("str" as BoxTypeName);
          break;
        case "bool":
          requiredTypes.add("bool" as BoxTypeName);
          break;
        case "NoneType":
        case "None":
          requiredTypes.add("none" as BoxTypeName);
          break;
        case "list":
          requiredTypes.add("list" as BoxTypeName);
          break;
        case "tuple":
          requiredTypes.add("tuple" as BoxTypeName);
          break;
        case "set":
          requiredTypes.add("set" as BoxTypeName);
          break;
        case "dict":
          requiredTypes.add("dict" as BoxTypeName);
          break;
        case ".class":
        case "object":
          requiredTypes.add("class" as BoxTypeName);
          break;
      }
    });

    return Array.from(requiredTypes);
  }, []);

  const { handleCanvasSubmit, handleCanvasSubmitAtLine } = useCanvasSubmission({
    selectedQuestionIndex: state.selectedQuestionIndex,
    selectedQuestionType: state.selectedQuestionType,
    elements: state.elements,
    setElements: state.setElements,
    setSubmissionResults: state.setSubmissionResults,
    setActiveInfoTab: state.setActiveInfoTab,
  });

  useCanvasLocalStorage({
    elements: state.elements,
    ids: state.elementIds,
    classes: state.elementClasses,
  });

  useUILocalStorage({
    activeTab: state.activeInfoTab,
    questionIndex: state.selectedQuestionIndex,
    questionType: state.selectedQuestionType,
    submissionResults: state.submissionResults,
    sandboxMode: state.isSandboxMode,
    questionView: state.questionView,
    isInfoPanelOpen: state.isInfoPanelOpen,
    canvasScale,
    editorScale,
  });

  useResponsivePanels({
    isPaletteOpen: state.isPaletteOpen,
    isInfoPanelOpen: state.isInfoPanelOpen,
    setIsPaletteOpen: state.setIsPaletteOpen,
    setIsInfoPanelOpen: state.setIsInfoPanelOpen,
  });

  const currentCanvasState = useMemo(
    () => ({
      elements: state.elements,
      ids: state.elementIds,
      classes: state.elementClasses,
    }),
    [state.elements, state.elementIds, state.elementClasses]
  );

  useEffect(() => {
    if (!isResizingPalette) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 50;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(0, Math.min(MAX_PALETTE_WIDTH, e.clientX));

      setTempPaletteWidth(newWidth);

      const now = Date.now();
      if (now - lastUpdateTime >= UPDATE_INTERVAL) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {
          setPaletteWidth(newWidth);
          lastUpdateTime = now;
        });
      }
    };

    const handleMouseUp = () => {
      if (tempPaletteWidth < SNAP_CLOSE_THRESHOLD) {
        state.setIsPaletteOpen(false);
        setPaletteWidth(DEFAULT_PALETTE_WIDTH);
        setTempPaletteWidth(DEFAULT_PALETTE_WIDTH);
      } else {
        const finalWidth = Math.max(MIN_PALETTE_WIDTH, tempPaletteWidth);
        setPaletteWidth(finalWidth);
        setTempPaletteWidth(finalWidth);
      }

      setIsResizingPalette(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isResizingPalette, tempPaletteWidth, state]);

  // Keep stable refs for info panel resize handlers so the effect
  // only re-runs when isResizingInfoPanel changes (not on every render).
  const infoPanelSetWidth = state.setInfoPanelWidth;
  const infoPanelSetResizing = state.setIsResizingInfoPanel;
  const infoPanelSetOpen = state.setIsInfoPanelOpen;
  const mainContainerRefCurrent = refs.mainContainerRef;

  useEffect(() => {
    if (!state.isResizingInfoPanel) return;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (event: MouseEvent) => {
      if (!mainContainerRefCurrent.current) return;

      const containerRect =
        mainContainerRefCurrent.current.getBoundingClientRect();
      const newWidth = containerRect.right - event.clientX;

      const maxWidthBasedOnViewport =
        window.innerWidth * MAX_INFO_PANEL_VIEWPORT_RATIO;
      const maxAllowedWidth = Math.min(
        containerRect.width - 100,
        maxWidthBasedOnViewport
      );

      const clamped = Math.max(50, Math.min(newWidth, maxAllowedWidth));
      infoPanelSetWidth(clamped);
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (mainContainerRefCurrent.current) {
        const containerRect =
          mainContainerRefCurrent.current.getBoundingClientRect();
        const finalWidth = containerRect.right - event.clientX;

        if (finalWidth < SNAP_CLOSE_THRESHOLD) {
          infoPanelSetOpen(false);
          infoPanelSetWidth(500);
        }
      }

      infoPanelSetResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [state.isResizingInfoPanel, infoPanelSetWidth, infoPanelSetResizing, infoPanelSetOpen, mainContainerRefCurrent]);

  return (
    <div className={styles.editorContainer}>
      <PanelToggleButtons
        isPaletteOpen={state.isPaletteOpen}
        isInfoPanelOpen={state.isInfoPanelOpen}
        onTogglePalette={() => state.setIsPaletteOpen((prev) => !prev)}
        onToggleInfoPanel={() => state.setIsInfoPanelOpen((prev) => !prev)}
      />

      {state.isPaletteOpen && (
        <>
          <div
            className={`${styles.palettePanel} ${
              isResizingPalette ? styles.resizing : ""
            }`}
            style={{
              width: `${isResizingPalette ? tempPaletteWidth : paletteWidth}px`,
              minWidth: `${
                isResizingPalette ? tempPaletteWidth : paletteWidth
              }px`,
            }}
          >
            <div
              className={styles.paletteContent}
              style={{
                width: `${paletteWidth}px`,
              }}
            >
              <Palette
                activeTab={state.activePaletteTab}
                setActive={state.setActivePaletteTab}
                requiredBoxes={
                  state.isSandboxMode && currentQuestionData
                    ? getRequiredBoxTypeNames(currentQuestionData)
                    : undefined
                }
                isPracticeMode={state.isSandboxMode}
                isSandboxMode={state.isSandboxMode}
                onModeToggle={() => state.setShowModeToggleModal(true)}
                onClear={() => state.setShowClearCanvasModal(true)}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                elements={state.elements}
                scale={canvasScale}
                onScaleChange={setCanvasScale}
                editorScale={editorScale}
                onEditorScaleChange={setEditorScale}
                fontScale={fontScale}
                onFontScaleChange={adjustFontScale}
              />
            </div>
          </div>

          <div
            className={styles.resizeDivider}
            onMouseDown={() => setIsResizingPalette(true)}
          />
        </>
      )}

      <div ref={refs.mainContainerRef} className={styles.mainContainer}>
        <div className={styles.canvasColumn}>
          <div className={styles.canvasArea}>
            <Canvas
              key={state.canvasResetKey}
              elements={state.elements}
              setElements={state.setElements}
              ids={state.elementIds}
              addId={addElementId}
              removeId={removeElementId}
              classes={state.elementClasses}
              addClasses={addElementClass}
              removeClasses={removeElementClass}
              sandbox={!state.isSandboxMode}
              canManageClasses={!state.isSandboxMode || state.selectedQuestionIndex === null}
              canManageFunctions={!state.isSandboxMode || state.selectedQuestionIndex === null}
              onClear={() => state.setShowClearCanvasModal(true)}
              onEditorOpenerReady={handleEditorOpenerReady}
              scale={canvasScale}
              onScaleChange={setCanvasScale}
              editorScale={editorScale}
              questionFunctionNames={
                state.isSandboxMode && currentQuestionData
                  ? getQuestionFunctionNames(currentQuestionData)
                  : undefined
              }
            />
          </div>

          {state.jsonOutput && (
            <pre className={styles.jsonPreview}>{state.jsonOutput}</pre>
          )}
        </div>

        {state.isInfoPanelOpen && (
          <>
            <div
              className={styles.resizeDivider}
              onMouseDown={() => state.setIsResizingInfoPanel(true)}
            />

            <div
              className={`${styles.infoPanel} ${
                state.isResizingInfoPanel ? styles.noTransition : ""
              }`}
              style={{
                width: `${state.infoPanelWidth}px`,
                maxWidth: MAX_INFO_PANEL_CSS_WIDTH,
              }}
            >
              <InformationTabs
                submissionResults={state.submissionResults}
                activeTab={state.activeInfoTab}
                setActive={state.setActiveInfoTab}
                questionSelected={state.selectedQuestionIndex !== null}
                questionIndex={state.selectedQuestionIndex}
                setQuestionIndex={state.setSelectedQuestionIndex}
                questionType={state.selectedQuestionType}
                setQuestionType={state.setSelectedQuestionType}
                questionView={state.questionView}
                setQuestionView={state.setQuestionView}
                onSubmit={handleCanvasSubmit}
                onSubmitAtLine={handleCanvasSubmitAtLine}
                setSubmissionResults={state.setSubmissionResults}
                onClearCanvas={clearCanvas}
                onRestoreCanvas={restoreCanvas}
                currentCanvasState={currentCanvasState}
                masterErrorList={masterErrorList}
                elements={state.elements}
                setElements={state.setElements}
                onOpenEditor={openEditor || (() => {})}
                isSandboxMode={state.isSandboxMode}
                onQuestionDataChange={setCurrentQuestionData}
                tabScrollPositions={state.tabScrollPositions}
                setTabScrollPositions={state.setTabScrollPositions}
                fontScale={fontScale}
              />
            </div>
          </>
        )}
      </div>

      {state.showClearCanvasModal && (
        <ConfirmationModal
          title="Clear Canvas?"
          message="This will clear the entire canvas and cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          onConfirm={() => {
            clearCanvas();
            state.setShowClearCanvasModal(false);
          }}
          onCancel={() => state.setShowClearCanvasModal(false)}
        />
      )}

      {state.showModeToggleModal && (
        <ConfirmationModal
          title="Switch Mode?"
          message="Switching modes will clear the canvas. Your current work will be saved and restored if you return to this question."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={() => {
            clearCanvas();
            state.setIsSandboxMode((prev) => !prev);
            state.setShowModeToggleModal(false);
          }}
          onCancel={() => state.setShowModeToggleModal(false)}
        />
      )}

    </div>
  );
}
