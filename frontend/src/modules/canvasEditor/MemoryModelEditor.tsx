import { useState, useRef, useEffect } from "react";
import Canvas from "./canvas/Canvas";
import Palette from "./palette/Palette";
import ConfirmationModal from "./confirmationModal/confirmationModal";
import styles from "./styles/MemoryModelEditor.module.css";
import { CanvasElement, ID, SubmissionResult } from "./shared/types";
import SubmitButton from "./canvas/components/SubmitButton";
import DownloadJsonButton from "./canvas/components/DownloadJsonButton";
import { submitCanvas } from "./services/questionValidationServices";

export default function MemoryModelEditor({
  sandbox = true,
}: {
  sandbox?: boolean;
}) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");
  const [ids, setIds] = useState<number[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  const [sandboxMode, setSandboxMode] = useState<boolean>(sandbox);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);

  const [placeholderWidth, setPlaceholderWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const subContainerRef = useRef<HTMLDivElement>(null);

  const clearBoard = (): void => {
    setElements([]);
    setIds([]);
    setJsonView("");
    setSubmissionResults([]);
    setClasses([]);
  };

  const handleToggleSandbox = (): void => setShowConfirm(true);

  const confirmClear = (): void => {
    clearBoard();
    setSandboxMode((prev) => !prev);
    setShowConfirm(false);
  };

  const cancelClear = (): void => setShowConfirm(false);

  const handleSubmit = async () => {
    try {
      const res = await submitCanvas(elements);
      setSubmissionResults(res);
      console.log('Backend response:', res);
    } catch (error) {
      console.error('Error sending to backend:', error);
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
      if (!isResizing || !subContainerRef.current) return;
      const rect = subContainerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const minPlaceholderWidth = 100;
      const maxPlaceholderWidth = rect.width - 100;
      if (newWidth >= minPlaceholderWidth && newWidth <= maxPlaceholderWidth) {
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
  }, [isResizing]);

  return (
    <div className={styles.container}>
      <div className={styles.paletteColumn}>
        <Palette />
      </div>

      <div ref={subContainerRef} className={styles.subContainer}>
        <div className={styles.column}>
          <div className={styles.canvasArea}>
            <Canvas
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
            {/* === Download & Submit Buttons === */}
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
                handleToggleSandbox();
              }}
            />
            <span className={styles.switchSlider}></span>
          </label>

          {jsonView && <pre className={styles.jsonView}>{jsonView}</pre>}
        </div>

        <div
          className={styles.placeholder}
          style={{ width: `${placeholderWidth}px` }}
        >
          Placeholder
          <div
            className={styles.resizeHandle}
            onMouseDown={() => setIsResizing(true)}
          />
        </div>
      </div>

      {showConfirm && (
        <ConfirmationModal
          title="Clear Canvas?"
          message="This will clear the entire canvas and cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          onConfirm={confirmClear}
          onCancel={cancelClear}
        />
      )}
    </div>
  );
}
