import React, { useEffect, useRef } from "react";

interface Props {
  id: number;
  onSave: () => void;    // Persist edits when closing normally
  onCancel: () => void;   // Close editor without deleting
  onRemove: () => void;  // Permanently delete the box
  children: React.ReactNode;
}

// Autosaves on outside‑click, and provides a bottom‑right "Remove" button to delete the box.
export default function EditorModule({ id, onSave, onCancel, onRemove, children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close & autosave when clicking outside the editor.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onSave();
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onSave, onCancel]);

  return (
    <div
      ref={wrapperRef}
      className="drag-handle"
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

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          style={{
            padding: "4px 8px",
            fontSize: "0.9rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => {
            onSave();
            onRemove();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
