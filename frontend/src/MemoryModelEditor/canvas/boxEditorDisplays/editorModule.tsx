import React, { useEffect, useRef } from "react";

interface Props {
  id: number | string;
  typeLabel?: string;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
  children: React.ReactNode;  
}

export default function EditorModule({
  id,
  typeLabel,
  onSave,
  onCancel,
  onRemove,
  children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onSave();
        onCancel();
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [onSave, onCancel]);


  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    fontSize: "0.9rem",
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  };


  return (
    <div
      ref={wrapRef}
      className="drag-handle"
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: "max-content",   
        minWidth: 320,          
        maxWidth: "90vw",       
        background: "#fff",
        border: "1px solid #888",
        borderRadius: 6,
        boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: typeLabel ? "space-between" : "flex-start",
          alignItems: "center",
          padding: 10,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        <span style={pill}>ID&nbsp;{id}</span>
        {typeLabel && <span style={pill}>{typeLabel}</span>}
      </div>

      <div style={{ padding: "0 24px" }}>{children}</div>

      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f44336")}
          onClick={() => {
            onSave();
            onRemove();
          }}
          style={{
            background: "#f44336",
            color: "#fff",
            border: "none",
            padding: "4px 6px",
            fontSize: "0.8rem",
            borderRadius: 4,
            cursor: "pointer",
            transition: "background-color 0.25s ease",
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
