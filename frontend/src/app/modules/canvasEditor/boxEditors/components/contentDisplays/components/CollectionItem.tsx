import { closeBase, closeButton, pill } from "../../../styles/boxEditorStyles";

interface Props {
  mode: "single" | "pair";
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const CollectionItem = ({ mode, items, setItems }: Props) => {
  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  if (mode === "single") {
    return (
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
            +
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
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {items.map((_, idx) => (
        <div
          key={idx}
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          <button style={pill}>+</button>
          <span style={{ fontSize: "2rem" }}>:</span>
          <div style={{ position: "relative" }}>
            <button style={pill}>+</button>
            <button
              onClick={() => removeItem(idx)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d32f2f")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f44336")
              }
              style={closeButton}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionItem;
