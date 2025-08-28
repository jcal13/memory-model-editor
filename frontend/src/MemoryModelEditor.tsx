import { useState, useRef, useEffect } from "react";
import Canvas from "./features/canvas/Canvas";
import Palette from "./features/palette/Palette";
import ConfirmationModal from "./features/canvas/components/confirmationModal";
import styles from "./MemoryModelEditor.module.css";
import {
  CanvasElement,
  ID,
  SubmissionResult,
  Tab,
  PaletteTab,
} from "./features/shared/types";
import SubmitButton from "./features/canvas/components/SubmitButton";
import DownloadJsonButton from "./features/canvas/components/DownloadOptionsButton";
import { submitCanvas } from "./features/validationServices/questionValidationService";
import InformationTabs from "./features/informationTabs/InformationTabs";
import {
  clearCanvasStorage,
  useCanvasLocalStorage,
  loadInitial,
  loadUIInitial,
  useUILocalStorage,
} from "./features/canvas/hooks/useEffect";

import ClearCanvasButton from "./features/canvas/components/ClearCanvasButton";

const DEFAULT_PLACEHOLDER_WIDTH = 500;
const MIN_PLACEHOLDER_WIDTH = 100;
const MAX_PLACEHOLDER_VIEWPORT_RATIO = 0.6667;
const PLACEHOLDER_SUBTRACT_OFFSET = 100;
const MAX_PLACEHOLDER_CSS_WIDTH = `${MAX_PLACEHOLDER_VIEWPORT_RATIO * 100}vw`;

export default function MemoryModelEditor({
  sandbox = true,
}: {
  sandbox?: boolean;
}) {
  const init = loadInitial();
  const uiInit = loadUIInitial();
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [elements, setElements] = useState<CanvasElement[]>(init.elements);
  const [jsonView, setJsonView] = useState<string>("");
  const [ids, setIds] = useState<number[]>(init.ids);
  const [classes, setClasses] = useState<string[]>(init.classes);
  const [activeTab, setActiveTab] = useState<Tab>(uiInit.activeTab);
  const [questionIndex, setQuestionIndex] = useState<number | null>(
    uiInit.questionIndex
  );
  const [questionType, setQuestionType] = useState<"test" | "practice" | null>(
    uiInit.questionType
  );
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult>(
    uiInit.submissionResults
  );

  const [sandboxMode, setSandboxMode] = useState<boolean>(() =>
    typeof uiInit.sandboxMode === "boolean" ? uiInit.sandboxMode : sandbox
  );

  const [paletteTab, setPaletteTab] = useState<PaletteTab>("all");
  const [placeholderWidth, setPlaceholderWidth] = useState<number>(
    DEFAULT_PLACEHOLDER_WIDTH
  );
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Separate modals
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState<boolean>(false);

  const subContainerRef = useRef<HTMLDivElement>(null);

  // Panel open/close
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);

  const clearBoard = (): void => {
    setElements([]);
    setIds([]);
    setClasses([]);
    setJsonView("");
    setSubmissionResults(null);
    setEditorResetKey((k) => k + 1);
    clearCanvasStorage();
  };

  const handleSubmit = async () => {
    if (questionIndex === null || questionType === null) {
      setSubmissionResults(null);
      setActiveTab("feedback");
      return;
    }

    const cleanElements = elements.filter((el) => !el.invalidated);
    try {
      const res = await submitCanvas(
        cleanElements,
        questionIndex,
        questionType
      );
      if (res !== undefined) setSubmissionResults(res);
      setActiveTab("feedback");
    } catch (error) {
      console.error("Error sending to backend:", error);
    }
  };

  const addId = (id: number) =>
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const insertAt = prev.findIndex((x) => x > id);
      return insertAt === -1
        ? [...prev, id]
        : [...prev.slice(0, insertAt), id, ...prev.slice(insertAt)];
    });

  const removeId = (id: ID) => setIds((prev) => prev.filter((v) => v !== id));

  const addClass = (className: string) =>
    setClasses((prev) => {
      if (prev.includes(className)) return prev;
      const insertAt = prev.findIndex((x) => x.localeCompare(className) > 0);
      return insertAt === -1
        ? [...prev, className]
        : [...prev.slice(0, insertAt), className, ...prev.slice(insertAt)];
    });

  const removeClass = (className: string) =>
    setClasses((prev) => prev.filter((v) => v !== className));

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing || !subContainerRef.current || !infoOpen) return;
      const rect = subContainerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const maxBasedOnViewport =
        window.innerWidth * MAX_PLACEHOLDER_VIEWPORT_RATIO;
      const maxPlaceholderWidth = Math.min(
        rect.width - PLACEHOLDER_SUBTRACT_OFFSET,
        maxBasedOnViewport
      );
      if (
        newWidth >= MIN_PLACEHOLDER_WIDTH &&
        newWidth <= maxPlaceholderWidth
      ) {
        setPlaceholderWidth(newWidth);
      }
    };
    const onMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, infoOpen]);

  useCanvasLocalStorage({ elements, ids, classes });

  useUILocalStorage({
    activeTab,
    questionIndex,
    questionType,
    submissionResults,
    sandboxMode,
  });

  return (
    <div className={styles.container}>
      <div
        className={styles.paletteColumn}
        style={{
          width: paletteOpen ? undefined : 0,
          minWidth: paletteOpen ? undefined : 0,
          overflow: "hidden",
        }}
      >
        <Palette activeTab={paletteTab} setActive={setPaletteTab} />
      </div>

      <button
        type="button"
        className={styles.panelTabBtnLeft}
        onClick={() => setPaletteOpen((v) => !v)}
        title={paletteOpen ? "Hide palette" : "Show palette"}
        aria-label={paletteOpen ? "Hide palette" : "Show palette"}
      >
        {paletteOpen ? "«" : "»"}
      </button>

      <div ref={subContainerRef} className={styles.subContainer}>
        <div className={styles.column}>
          <div className={styles.canvasArea}>
            <ClearCanvasButton onClick={() => setShowClearConfirm(true)} />

            <Canvas
              key={editorResetKey}
              elements={elements}
              setElements={setElements}
              ids={ids}
              addId={addId}
              removeId={removeId}
              classes={classes}
              addClasses={addClass}
              removeClasses={removeClass}
              sandbox={sandboxMode}
            />
            <DownloadJsonButton elements={elements} />
            <SubmitButton onClick={handleSubmit} />
          </div>

          <label className={styles.switchWrapper}>
            <input
              type="checkbox"
              className={styles.switchInput}
              checked={sandboxMode}
              onChange={(e) => {
                e.preventDefault();
                setShowToggleConfirm(true);
              }}
            />
            <span className={styles.switchSlider}></span>
          </label>

          {jsonView && <pre className={styles.jsonView}>{jsonView}</pre>}
        </div>

        <button
          type="button"
          className={styles.panelTabBtnRight}
          onClick={() => {
            setIsResizing(false);
            setInfoOpen((v) => !v);
          }}
          title={infoOpen ? "Hide info" : "Show info"}
          aria-label={infoOpen ? "Hide info" : "Show info"}
        >
          {infoOpen ? "»" : "«"}
        </button>

        <div
          className={styles.placeholder}
          style={{
            width: infoOpen ? `${placeholderWidth}px` : 0,
            maxWidth: MAX_PLACEHOLDER_CSS_WIDTH,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <InformationTabs
            submissionResults={submissionResults}
            activeTab={activeTab}
            setActive={setActiveTab}
            questionSelected={questionIndex !== null}
            questionIndex={questionIndex}
            setQuestionIndex={setQuestionIndex}
            questionType={questionType}
            setQuestionType={setQuestionType}
          />
          <div
            className={styles.resizeHandle}
            onMouseDown={() => infoOpen && setIsResizing(true)}
            style={{ pointerEvents: infoOpen ? "auto" : "none" }}
          />
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmationModal
          title="Clear Canvas?"
          message="This will clear the entire canvas and cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          onConfirm={() => {
            clearBoard();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {showToggleConfirm && (
        <ConfirmationModal
          title="Switch Mode?"
          message="Switching modes will clear the canvas. Continue?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={() => {
            clearBoard();
            setSandboxMode((prev) => !prev);
            setShowToggleConfirm(false);
          }}
          onCancel={() => setShowToggleConfirm(false)}
        />
      )}
    </div>
  );
}
