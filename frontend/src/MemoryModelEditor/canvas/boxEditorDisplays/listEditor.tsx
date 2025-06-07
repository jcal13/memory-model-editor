import { useState } from "react";
import EditorModule from "./editorModule";

type Props = {
  element: {
    id: string;
    kind: { name: string; type: string; value: any[] };
  };
  onSave: (data: { name: string; type: string; value: any[] }) => void;
  onCancel: () => void;
  onRemove: () => void;
};

export default function ListEditor({
  element,
  onSave,
  onCancel,
  onRemove,
}: Props) {
  const [items, setItems] = useState<any[]>(element.kind.value || []);

  const addItem = () => setItems([...items, null]);
  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const handleSave = () => {
    onSave({ name: element.kind.name, type: element.kind.type, value: items });
  };

  const pill: React.CSSProperties = {
    width: 80,
    height: 60,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.6rem",
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
    position: "relative",
    cursor: "pointer",
  };

  const closeBase: React.CSSProperties = {
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

  const addBtn: React.CSSProperties = {
    padding: "6px 14px",
    fontSize: "0.9rem",
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
    cursor: "pointer",
  };

  return (
    <EditorModule
      id={Number(element.id)}
      typeLabel="list"
      onSave={handleSave}
      onCancel={onCancel}
      onRemove={onRemove}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "flex-start",
          marginBottom: 24,
        }}
      >
        {items.map((_, idx) => (
          <div key={idx} style={pill}>
            <p style={{ opacity: 0.5 }}>+</p>
            <button
              onClick={() => removeItem(idx)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d32f2f")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f44336")
              }
              style={closeBase}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
      >
        <button onClick={addItem} style={addBtn}>
          + Add Element
        </button>
      </div>
    </EditorModule>
  );
}
