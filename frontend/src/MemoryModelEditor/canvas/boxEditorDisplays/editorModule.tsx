import React from "react";

interface Props {
  id: number;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export default function EditorModule({ id, onSave, onCancel, children }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 1000,
        background: "#fff",
        border: "1px solid #888",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: 12,
        width: 250,
      }}
    >
      <div
        style={{
          border: "1px solid #888",
          background: "#f5f5f5",
          display: "inline-block",
          padding: "2px 6px",
          fontSize: "0.8rem",
          marginBottom: 8,
        }}
      >
        ID: {id}
      </div>

      {children}

      <div style={{ marginTop: 8 }}>
        <button onClick={onSave}>Save</button>
        <button onClick={onCancel} style={{ marginLeft: 4 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
