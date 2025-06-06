import { useState } from "react";
import Canvas from "./canvas/canvas";
import Palette from "./palette/palette";
import { CanvasElement } from "./types";
import { buildJSONFromElements } from "./jsonConversion/jsonBuilder";  // <- updated import

export default function MemoryModelEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");

  const showJson = (): void => {
    const snapshot = buildJSONFromElements(elements);
    setJsonView(JSON.stringify(snapshot, null, 2));
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
      <Palette />
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas elements={elements} setElements={setElements} />

        <button
          onClick={() => {
            const blob = new Blob([jsonView], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "data.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            position: "absolute", top: 50, right: 8, padding: "4px 8px",
          }}
        >
          Download JSON
        </button>

        {jsonView && (
          <pre style={{
            position: "fixed", bottom: "40px", right: "8px",
            maxHeight: "300px", maxWidth: "300px", overflow: "auto",
            background: "#f5f5f5", border: "1px solid #ccc", padding: "8px",
            fontSize: "0.75rem", zIndex: 9999, textAlign: "left",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {jsonView}
          </pre>
        )}
      </div>
    </div>
  );
}
