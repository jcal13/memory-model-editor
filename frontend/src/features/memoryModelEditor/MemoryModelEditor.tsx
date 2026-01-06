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

interface MemoryModelEditorProps {
  sandbox?: boolean;
}

export default function MemoryModelEditor({
  sandbox = true,
}: MemoryModelEditorProps) {
  // State management
  const state = useMemoryModelEditorState(sandbox);
  const refs = useMemoryModelEditorRefs();

  // Store the openEditor function from Canvas
  const [openEditor, setOpenEditor] = useState<
    ((element: CanvasElement) => void) | null
  >(null);

  const handleEditorOpenerReady = useCallback(
    (opener: (element: CanvasElement) => void) => {
      setOpenEditor(() => opener);
    },
    []
  );

  // Master error list - aggregates all validation errors from all elements
  const masterErrorList: MasterErrorList = useMemo(() => {
    return createMasterErrorList(state.elements);
  }, [state.elements]);

  // Debug: Expose master error list to window for development
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).masterErrorList = {
        errorMap: masterErrorList,
        totalErrors: getTotalErrorCount(masterErrorList),
        elementsWithErrors: getElementsWithErrorsCount(masterErrorList),
        flatList: flattenErrorList(masterErrorList),
      };
    }
  }, [masterErrorList]);

  // Canvas management functions
  const clearCanvas = (): void => {
    state.setElements([]);
    state.setElementIds([]);
    state.setElementClasses([]);
    state.setJsonOutput("");
    state.setSubmissionResults(null);
    state.setCanvasResetKey((prev) => prev + 1);
    clearCanvasStorage();
  };

  const restoreCanvas = (
    elements: CanvasElement[],
    ids: number[],
    classes: string[]
  ): void => {
    state.setElements(elements);
    state.setElementIds(ids);
    state.setElementClasses(classes);
    state.setCanvasResetKey((prev) => prev + 1);
  };

  const addElementId = (id: number): void => {
    state.setElementIds((prevIds) => {
      if (prevIds.includes(id)) return prevIds;

      const insertIndex = prevIds.findIndex((existingId) => existingId > id);
      return insertIndex === -1
        ? [...prevIds, id]
        : [...prevIds.slice(0, insertIndex), id, ...prevIds.slice(insertIndex)];
    });
  };

  const removeElementId = (id: any): void => {
    state.setElementIds((prevIds) =>
      prevIds.filter((existingId) => existingId !== id)
    );
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

  // Custom hooks for functionality
  const { handleCanvasSubmit } = useCanvasSubmission({
    selectedQuestionIndex: state.selectedQuestionIndex,
    selectedQuestionType: state.selectedQuestionType,
    elements: state.elements,
    setElements: state.setElements,
    setSubmissionResults: state.setSubmissionResults,
    setActiveInfoTab: state.setActiveInfoTab,
  });

  // Info panel resize functionality
  useInfoPanelResize({
    isResizingInfoPanel: state.isResizingInfoPanel,
    isInfoPanelOpen: state.isInfoPanelOpen,
    mainContainerRef: refs.mainContainerRef,
    setInfoPanelWidth: state.setInfoPanelWidth,
    setIsResizingInfoPanel: state.setIsResizingInfoPanel,
  });

  // localStorage persistence
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

  return (
    <div className={styles.editorContainer}>
      {/* Palette Panel */}
      <div
        className={styles.palettePanel}
        style={{
          width: state.isPaletteOpen ? "280px" : 0,
          minWidth: state.isPaletteOpen ? "280px" : 0,
          overflow: "hidden",
        }}
      >
        <Palette
          activeTab={state.activePaletteTab}
          setActive={state.setActivePaletteTab}
        />
      </div>

      {/* Palette Toggle Button */}
      <button
        type="button"
        className={styles.paletteToggleButton}
        onClick={() => state.setIsPaletteOpen((prev) => !prev)}
        title={state.isPaletteOpen ? "Hide palette" : "Show palette"}
        aria-label={state.isPaletteOpen ? "Hide palette" : "Show palette"}
      >
        {state.isPaletteOpen ? "«" : "»"}
      </button>

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

        {/* Info Panel Toggle Button */}
        <button
          type="button"
          className={styles.infoPanelToggleButton}
          onClick={() => {
            state.setIsResizingInfoPanel(false);
            state.setIsInfoPanelOpen((prev) => !prev);
          }}
          title={state.isInfoPanelOpen ? "Hide info" : "Show info"}
          aria-label={state.isInfoPanelOpen ? "Hide info" : "Show info"}
        >
          {state.isInfoPanelOpen ? "»" : "«"}
        </button>

        {/* Info Panel */}
        <div
          className={`${styles.infoPanel} ${
            state.isResizingInfoPanel ? styles.noTransition : ""
          }`}
          style={{
            width: state.isInfoPanelOpen ? `${state.infoPanelWidth}px` : 0,
            maxWidth: MAX_INFO_PANEL_CSS_WIDTH,
            overflow: "hidden",
            position: "relative",
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

          {/* Resize Handle */}
          <div
            className={styles.infoPanelResizeHandle}
            onMouseDown={() =>
              state.isInfoPanelOpen && state.setIsResizingInfoPanel(true)
            }
            style={{ pointerEvents: state.isInfoPanelOpen ? "auto" : "none" }}
          />
        </div>
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
