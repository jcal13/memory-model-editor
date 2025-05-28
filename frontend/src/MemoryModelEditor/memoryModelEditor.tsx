import { useState } from "react";
import Canvas from "./canvas/canvas";
import Palette from "./palette/palette";
import { CanvasElement } from "./types";

export default function MemoryModelEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");

  const showJson = () => {
    const objs = elements.map(({ id, kind }) => {
      const base = { id, name: kind.name, type: kind.type };

      switch (kind.name) {
        case "primitive": {
          let parsed: string | number | boolean = kind.value;
          if (kind.type === "int") parsed = parseInt(kind.value, 10);
          else if (kind.type === "float") parsed = parseFloat(kind.value);
          else if (kind.type === "bool") parsed = kind.value === "true";
          return { ...base, value: parsed };
        }

        case "list":
        case "tuple":
        case "set":
          return { ...base, value: kind.value }; 

        case "dict":
          return { ...base, value: kind.value }; 

        case "function":
          return {
            ...base,
            functionName: kind.functionName,
            params: kind.params,
            value: null,
          };

        default:
          return { ...base, value: null };
      }
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
