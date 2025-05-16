import { useState } from "react";
import Canvas from "./canvas/canvas";
import Palette from "./palette/palette";
import { MemoryVizObject, CanvasElement } from "./types";

export default function MemoryModelEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");

  const showJson = () => {
    const objs: MemoryVizObject[] = elements.map((el) => {
      const { id, kind } = el;
      let typedVal: string | number | boolean = kind.value;

      if (kind.type === "int") typedVal = parseInt(kind.value, 10);
      if (kind.type === "float") typedVal = parseFloat(kind.value);
      if (kind.type === "bool") typedVal = kind.value === "true";

      return { id, type: kind.type, value: typedVal };
    });

    setJsonView(JSON.stringify(objs, null, 2));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <Palette />

      <div style={{ flex: 1, position: "relative" }}>
        <Canvas elements={elements} setElements={setElements} />

        <button
          onClick={showJson}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: "4px 8px",
          }}
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
    </div>
  );
}
