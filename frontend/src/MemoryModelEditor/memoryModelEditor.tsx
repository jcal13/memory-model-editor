import { useState } from "react";
import Canvas from "./canvas/canvas";
import Palette from "./palette/palette";
import { CanvasElement } from "./types";

export default function MemoryModelEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [jsonView, setJsonView] = useState<string>("");

  type FrameEntry = {
    type: ".frame";
    name: string;
    id: null;
    value: Record<string, number>;
  };

  type ValueEntry = {
    type: string;
    id: number;
    value: any;
    name?: string;
  };

  const showJson = (): void => {
    const idMap: Map<number, number> = new Map();
    let nextId: number = 1;

    const getOrAssignId = (elementId: number): number => {
      if (!idMap.has(elementId)) {
        idMap.set(elementId, nextId++);
      }
      return idMap.get(elementId)!;
    };

    const jsonData: FrameEntry[] = [];
    const valueEntries: ValueEntry[] = [];

    // Step 1: Add a .frame per function
    elements.forEach(({ id, kind }) => {
      if (kind.name === "function") {
        const frameValue: Record<string, number> = {};
        for (const param of kind.params || []) {
          if (param.targetId !== null) {
            frameValue[param.name] = param.targetId;
          }
        }
        jsonData.push({
          type: ".frame",
          name: kind.functionName || `func${id}`,
          id: null,
          value: frameValue
        });
      }
    });


    
    elements.forEach(({ id, kind }) => {
      const assignedId: number = id;

      if (kind.name === "primitive") {
        let parsed: string | number | boolean = kind.value;
        if (kind.type === "int") parsed = parseInt(kind.value, 10);
        else if (kind.type === "float") parsed = parseFloat(kind.value);
        else if (kind.type === "bool") parsed = kind.value === "true";

        valueEntries.push({
          type: kind.type,
          id: assignedId,
          value: parsed
        });

      } else if (["list", "tuple", "set", "dict"].includes(kind.name)) {
        valueEntries.push({
          type: kind.type,
          id: assignedId,
          value: kind.value
        });
      }
    });

    const snapshot: (FrameEntry | ValueEntry)[] = [...jsonData, ...valueEntries];
    setJsonView(JSON.stringify(snapshot, null, 2));
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
            display: "flex",
            flexDirection: "column",
            gap: "8px", 
          }}
        >
          Show JSON
        </button>

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
          position: "absolute",
          top: 50,
          right: 8,
          padding: "4px 8px",
          }}
        >
        Download JSON
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