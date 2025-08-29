import Canvas from "../canvas/Canvas";
import Palette from "../palette/Palette";
import ConfirmationModal from "./components/ConfirmationModal";
import InformationTabs from "../informationTabs/InformationTabs";
import styles from "./MemoryModelEditor.module.css";
import {
  ClearCanvasButton,
  SubmitButton,
  DownloadButton,
} from "./components/CanvasButtons";

import { useMemoryModelEditorState } from "./hooks/useState";
import { useMemoryModelEditorRefs } from "./hooks/useRef";
import {
  useCanvasLocalStorage,
  useUILocalStorage,
  useInfoPanelResize,
  useCanvasSubmission,
} from "./hooks/useEffect";

// Layout constants
const MAX_INFO_PANEL_VIEWPORT_RATIO = 0.6667;
const MAX_INFO_PANEL_CSS_WIDTH = `${MAX_INFO_PANEL_VIEWPORT_RATIO * 100}vw`;

interface MemoryModelEditorProps {
  sandbox?: boolean;
}

export default function MemoryModelEditor({
  sandbox = true,
}: MemoryModelEditorProps) {
  const state = useMemoryModelEditorState(sandbox);
  const refs = useMemoryModelEditorRefs();

  const { handleCanvasSubmit } = useCanvasSubmission({
    selectedQuestionIndex: state.selectedQuestionIndex,
    selectedQuestionType: state.selectedQuestionType,
    elements: state.elements,
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

  return (
    <div className={styles.editorContainer}>
      <div
        className={styles.palettePanel}
        style={{
          width: state.isPaletteOpen ? undefined : 0,
          minWidth: state.isPaletteOpen ? undefined : 0,
          overflow: "hidden",
        }}
      >
        <Palette
          activeTab={state.activePaletteTab}
          setActive={state.setActivePaletteTab}
        />
      </div>

      <button
        type="button"
        className={styles.paletteToggleButton}
        onClick={() => state.setIsPaletteOpen((prev) => !prev)}
        title={state.isPaletteOpen ? "Hide palette" : "Show palette"}
        aria-label={state.isPaletteOpen ? "Hide palette" : "Show palette"}
      >
        {state.isPaletteOpen ? "«" : "»"}
      </button>

      <div ref={refs.mainContainerRef} className={styles.mainContainer}>
        <div className={styles.canvasColumn}>
          <div className={styles.canvasArea}>
            <ClearCanvasButton
              onClick={() => state.setShowClearCanvasModal(true)}
            />

            <Canvas
              key={state.canvasResetKey}
              elements={state.elements}
              setElements={state.setElements}
              ids={state.elementIds}
              addId={state.addElementId}
              removeId={state.removeElementId}
              classes={state.elementClasses}
              addClasses={state.addElementClass}
              removeClasses={state.removeElementClass}
              sandbox={state.isSandboxMode}
            />

            <DownloadButton
              elements={state.elements}
              canvasSelector={`.${styles.canvasColumn}`}
            />
            <SubmitButton onClick={handleCanvasSubmit} />
          </div>

          <label className={styles.modeToggleSwitch}>
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

          {state.jsonOutput && (
            <pre className={styles.jsonPreview}>{state.jsonOutput}</pre>
          )}
        </div>

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

        <div
          className={styles.infoPanel}
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
          />

          <div
            className={styles.infoPanelResizeHandle}
            onMouseDown={() =>
              state.isInfoPanelOpen && state.setIsResizingInfoPanel(true)
            }
            style={{ pointerEvents: state.isInfoPanelOpen ? "auto" : "none" }}
          />
        </div>
      </div>

      {state.showClearCanvasModal && (
        <ConfirmationModal
          title="Clear Canvas?"
          message="This will clear the entire canvas and cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          onConfirm={() => {
            state.clearCanvas();
            state.setShowClearCanvasModal(false);
          }}
          onCancel={() => state.setShowClearCanvasModal(false)}
        />
      )}

      {state.showModeToggleModal && (
        <ConfirmationModal
          title="Switch Mode?"
          message="Switching modes will clear the canvas. Continue?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={() => {
            state.clearCanvas();
            state.setIsSandboxMode((prev) => !prev);
            state.setShowModeToggleModal(false);
          }}
          onCancel={() => state.setShowModeToggleModal(false)}
        />
      )}
    </div>
  );
}
