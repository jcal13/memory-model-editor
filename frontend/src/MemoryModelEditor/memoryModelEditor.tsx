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
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <Palette />
      </div>

      <div
        style={{
          flex: 2,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <Canvas elements={elements} setElements={setElements} />
        </div>

        {/* <button
          onClick={showJson}
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            padding: "4px 8px",
            zIndex: 10
          }}
        >
          Show JSON
        </button> */}

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

      <div
        style={{
          flex: 1,
          borderLeft: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          fontStyle: "italic",
        }}
      >
        Placeholder
      </div>
    </div>
  );
}
