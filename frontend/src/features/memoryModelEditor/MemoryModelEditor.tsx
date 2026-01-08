import Canvas from "../canvas/Canvas";
import Palette from "../palette/Palette";
import ConfirmationModal from "./components/ConfirmationModal";
import InformationTabs from "../informationTabs/InformationTabs";
import styles from "./MemoryModelEditor.module.css";
import { useResponsivePanels } from "./hooks/useResponsivePanels";

import {
  useMemoryModelEditorState,
  clearCanvasStorage,
} from "./hooks/useMemoryModelEditorState";
import { useMemoryModelEditorRefs } from "./hooks/useRef";
import {
  useCanvasLocalStorage,
  useUILocalStorage,
} from "./hooks/useLocalStorage";
import { useInfoPanelResize } from "./hooks/useInfoPanel";
import { useCanvasSubmission } from "./hooks/useCanvasSubmission";
import { useMemo, useEffect, useState, useCallback } from "react";
import { ValidationError, CanvasElement } from "../shared/types";
import {
  createMasterErrorList,
  MasterErrorList,
  getTotalErrorCount,
  getElementsWithErrorsCount,
  flattenErrorList,
} from "./utils/masterErrorList";

// Layout constants
const MAX_INFO_PANEL_VIEWPORT_RATIO = 0.6667;
const MAX_INFO_PANEL_CSS_WIDTH = `${MAX_INFO_PANEL_VIEWPORT_RATIO * 100}vw`;
const MIN_PALETTE_WIDTH = 200;
const MAX_PALETTE_WIDTH = 400;
const DEFAULT_PALETTE_WIDTH = 280;

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

  const handleEditorOpenerReady = useCallback(
    (opener: (element: CanvasElement) => void) => {
      setOpenEditor(() => opener);
    },
    []
  );

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
  };

  const restoreCanvas = (
    elements: CanvasElement[],
    ids: number[],
    classes: string[]
  ) => {
    state.setElements(elements);
    state.setElementIds(ids);
    state.setElementClasses(classes);
  };

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

  const { handleCanvasSubmit } = useCanvasSubmission({
    selectedQuestionIndex: state.selectedQuestionIndex,
    selectedQuestionType: state.selectedQuestionType,
    elements: state.elements,
    setElements: state.setElements,
    setSubmissionResults: state.setSubmissionResults,
    setActiveInfoTab: state.setActiveInfoTab,
  });

  useInfoPanelResize({
    isResizingInfoPanel: state.isResizingInfoPanel,
    isInfoPanelOpen: state.isInfoPanelOpen,
    mainContainerRef: refs.mainContainerRef,
    setInfoPanelWidth: state.setInfoPanelWidth,
    setIsResizingInfoPanel: state.setIsResizingInfoPanel,
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
      const newWidth = Math.max(
        MIN_PALETTE_WIDTH,
        Math.min(MAX_PALETTE_WIDTH, e.clientX)
      );

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
      setPaletteWidth(tempPaletteWidth);
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
  }, [isResizingPalette, tempPaletteWidth]);

  return (
    <div className={styles.editorContainer}>
      {/* Palette Panel */}
      {state.isPaletteOpen && (
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
            />
          </div>

          {/* Palette Resize Handle */}
          <div
            className={styles.paletteResizeHandle}
            onMouseDown={() => setIsResizingPalette(true)}
          />
        </div>
      )}

      {/* Main Container */}
      <div ref={refs.mainContainerRef} className={styles.mainContainer}>
        {/* Canvas Column */}
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
              sandbox={state.isSandboxMode}
              onClear={() => state.setShowClearCanvasModal(true)}
              onEditorOpenerReady={handleEditorOpenerReady}
            />
          </div>

          {/* Mode Toggle Switch */}
          <label
            className={styles.modeToggleSwitch}
            data-editor-control="mode-toggle"
          >
            <input
              type="checkbox"
              className={styles.modeToggleInput}
              checked={state.isSandboxMode}
              onChange={(event) => {
                event.preventDefault();
                state.setShowModeToggleModal(true);
              }}
            />
            <span className={styles.modeToggleSlider}></span>
          </label>

          {/* JSON Preview */}
          {state.jsonOutput && (
            <pre className={styles.jsonPreview}>{state.jsonOutput}</pre>
          )}
        </div>

        {/* Info Panel */}
        {state.isInfoPanelOpen && (
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
              onSubmit={handleCanvasSubmit}
              setSubmissionResults={state.setSubmissionResults}
              onClearCanvas={clearCanvas}
              onRestoreCanvas={restoreCanvas}
              currentCanvasState={currentCanvasState}
              masterErrorList={masterErrorList}
              elements={state.elements}
              setElements={state.setElements}
              onOpenEditor={openEditor || (() => {})}
              isSandboxMode={state.isSandboxMode}
            />

            {/* Info Panel Resize Handle */}
            <div
              className={styles.infoPanelResizeHandle}
              onMouseDown={() => state.setIsResizingInfoPanel(true)}
            />
          </div>
        )}
      </div>

      {/* Clear Canvas Modal */}
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

      {/* Mode Toggle Modal */}
      {state.showModeToggleModal && (
        <ConfirmationModal
          title="Switch Mode?"
          message="Switching modes will clear the canvas. Continue?"
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
