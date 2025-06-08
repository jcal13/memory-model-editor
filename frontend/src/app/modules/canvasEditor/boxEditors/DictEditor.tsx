import { useState } from "react";
import EditorModule from "./EditorModule";

type Props = {
  element: {
    id: string;
    kind: {
      name: string;          
      type: string;         
      value: Record<string, number | null>;
    };
  };
  onSave: (data: { name: string; type: string; value: Record<string, number | null> }) => void;
  onCancel: () => void;
  onRemove: () => void;
};

export default function DictEditor({ element, onSave, onCancel, onRemove }: Props) {
  const [entries, setEntries] = useState(Object.entries(element.kind.value || {}));

  const addEntry    = () => setEntries([...entries, ["", null]]);
  const removeEntry = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));

  const handleSave = () => {
    const out: Record<string, number | null> = {};
    for (const [k, v] of entries) if (k.trim()) out[k] = v;
    onSave({ name: "dict", type: "dict", value: out });
  };

  const pill: React.CSSProperties = {
    width: 100,
    height: 70,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.8rem",
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
    cursor: "pointer",
    position: "relative",
  };

  const closeBtn: React.CSSProperties = {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    background: "#f44336",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background-color 0.25s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const addPairBtn: React.CSSProperties = {
    padding: "10px 26px",
    fontSize: "1.1rem",
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
    cursor: "pointer",
  };

  return (
    <EditorModule
      id={Number(element.id)}
      typeLabel="dict"
      onSave={handleSave}
      onCancel={onCancel}
      onRemove={onRemove}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
        {entries.map(([key, val], idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button style={pill}>+</button>
            <span style={{ fontSize: "2rem" }}>:</span>
            <div style={{ position: "relative" }}>
              <button style={pill}>+</button>
              <button
                onClick={() => removeEntry(idx)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f44336")}
                style={closeBtn}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button onClick={addEntry} style={addPairBtn}>
          Add Pair
        </button>
      </div>
    </EditorModule>
  );
}
