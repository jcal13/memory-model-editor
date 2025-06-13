import { useState, useRef, useEffect } from "react";
import Canvas from "./canvas/Canvas";
import Palette from "./palette/Palette";
import { CanvasElement } from "./shared/types";
import { buildJSONFromElements } from "./jsonConversion/jsonBuilder";
import { ID } from "./shared/types";


export default function MemoryModelEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");
  const [ids, setIds] = useState<ID[]>([]);

  // Width state for the right placeholder pane
  const [placeholderWidth, setPlaceholderWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Ref to sub-container (canvas + placeholder)
  const subContainerRef = useRef<HTMLDivElement>(null);

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
      const maxPlaceholderWidth = rect.width - 100; // leave at least 100px for canvas
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      <div style={{ overflowY: "auto" }}>
        <Palette />
      </div>

      <div
        ref={subContainerRef}
        style={{ display: "flex", flex: 1, position: "relative" }}
      >
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Canvas elements={elements} setElements={setElements} ids={ids} addId={addId} removeId={removeId} />
          </div>
          <button
            onClick={showJson}
            style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 8px", zIndex: 10 }}
          >
            Show JSON
          </button>
          {jsonView && (
            <pre
              style={{
                position: "fixed",
                bottom: "40px",
                right: "8px",
                maxHeight: "300px",
                maxWidth: "300px",
                overflow: "auto",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                padding: "8px",
                fontSize: "0.75rem",
                zIndex: 9999,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {jsonView}
            </pre>
          )}
        </div>

        <div
          style={{
            width: placeholderWidth,
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            fontStyle: "italic",
            position: "relative",
          }}
        >
          Placeholder
          <div
            onMouseDown={() => setIsResizing(true)}
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", cursor: "col-resize", zIndex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
