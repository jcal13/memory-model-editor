import { useState, useRef, useEffect } from "react";
import Canvas from "./canvas/Canvas";
import Palette from "./palette/Palette";
import ConfirmationModal from "./confirmationModal/confirmationModal";
import styles from "./styles/MemoryModelEditor.module.css";
import { CanvasElement } from "./shared/types";
import { buildJSONFromElements } from "./jsonConversion/jsonBuilder";
import { ID } from "./shared/types";

export default function MemoryModelEditor({ sandbox = true }: { sandbox?: boolean }) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");
  const [ids, setIds] = useState<ID[]>([]);
  const [sandboxMode, setSandboxMode] = useState<boolean>(sandbox);

  // width state for placeholder panel
  const [placeholderWidth, setPlaceholderWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // simple modal toggle
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Ref to sub-container (canvas + placeholder)
  const subContainerRef = useRef<HTMLDivElement>(null);

  const clearBoard = (): void => {
    setElements([]);
    setIds([]);
    setJsonView("");
  };

  const handleToggleSandbox = (): void => setShowConfirm(true);

  const confirmClear = (): void => {
    clearBoard();
    setSandboxMode(prev => !prev);
    setShowConfirm(false);
  };

  const cancelClear = (): void => setShowConfirm(false);

  const showJson = (): void => {
    const snapshot = buildJSONFromElements(elements);
    setJsonView(JSON.stringify(snapshot, null, 2));
  };

  const addId = (id: ID) => setIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  const removeId = (id: ID) => setIds(prev => prev.filter(v => v !== id));

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
    const onMouseUp = () => { if (isResizing) setIsResizing(false); };
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
              sandbox={sandboxMode}
            />
          </div>

          <label className={styles.switchWrapper}>
            <input
              type="checkbox"
              className={styles.switchInput}
              checked={sandboxMode}
              onChange={e => {
                e.preventDefault();
                handleToggleSandbox();
              }}
            />
            <span className={styles.switchSlider}></span>
          </label>

          <button className={styles.jsonButton} onClick={showJson}>
            Show JSON
          </button>

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
