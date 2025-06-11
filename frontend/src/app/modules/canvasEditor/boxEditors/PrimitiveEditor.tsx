import React, { useState, useEffect, useRef } from "react";

type PrimitiveType = "None" | "int" | "float" | "str" | "bool";

interface PrimitiveKind {
  name: "primitive";
  type: PrimitiveType;
  value: string;
}

interface Props {
  element: { id: number | "None"; kind: PrimitiveKind };
  onSave: (id: number | "None", kind: PrimitiveKind) => void;
  onCancel: () => void;
  onRemove: () => void;
}

export default function PrimitiveEditor({
  element,
  onSave,
  onCancel,
  onRemove,
}: Props) {
  const [dataType, setDataType] = useState<PrimitiveType>(element.kind.type);
  const [value, setValue] = useState(element.kind.value);
  const [hoverRemove, setHoverRemove] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dataTypeRef = useRef<PrimitiveType>(dataType);
  const valueRef = useRef<string>(value);

  useEffect(() => {
    dataTypeRef.current = dataType;
  }, [dataType]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onSave(Number(element.id),
        {
          name: element.kind.name,
          type: dataTypeRef.current,
          value: valueRef.current,
        }
      );
      }
    };
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("mousedown", outside);
    };
  }, [onSave, element.kind.name]);

  const int = (v: string) => /^-?\d+$/.test(v);
  const float = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const bool = (v: string) => v === "true" || v === "false";

  const isValid = () =>
    dataType === "int"
      ? int(value)
      : dataType === "float"
      ? float(value)
      : dataType === "bool"
      ? bool(value)
      : true;

  const handleSave = () => {
    onSave(element.id, { name: element.kind.name, type: dataType, value });
  };

  const changeType = (t: PrimitiveType) => {
    setDataType(t);
    if (t === "bool") {
      setValue("true");
    } else if (t === "int" && !int(value)) {
      setValue("0");
    } else if (t === "float" && !float(value)) {
      setValue("0.0");
    } else if (t === "None") {
      setValue("None");
    }
  };

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
        right: 20,
        width: 320,
        height: 320,
        background: "#fff",
        border: "1px solid #888",
        borderRadius: 6,
        boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        <span style={pill}>ID&nbsp;{element.id}</span>

        <select
          value={dataType}
          onChange={(e) => changeType(e.target.value as PrimitiveType)}
          style={{
            ...pill,
            cursor: "pointer",
            appearance: "none",
            textAlign: "center",
          }}
        >
          <option value="None">None</option>
          <option value="int">int</option>
          <option value="float">float</option>
          <option value="str">str</option>
          <option value="bool">bool</option>
        </select>
      </div>

      <div style={{ padding: "0 24px", textAlign: "center" }}>
        {dataType === "bool" ? (
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {["true", "false"].map((opt) => (
              <label key={opt} style={{ fontSize: "1rem" }}>
                <input
                  type="radio"
                  checked={value === opt}
                  onChange={() => setValue(opt)}
                  style={{ marginRight: 6 }}
                />
                {opt}
              </label>
            ))}
          </div>
        ) : dataType === "None" ? (
          <div style={{ fontSize: "1rem", color: "#666" }}>None</div>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="value"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 4,
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: "1rem",
            }}
          />
        )}

        {!isValid() && (
          <div
            style={{
              color: "red",
              fontSize: "0.85rem",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Invalid&nbsp;{dataType}&nbsp;value
          </div>
        )}
      </div>

      <div style={{ padding: 24, display: "flex", justifyContent: "flex-end" }}>
        <button
          onMouseEnter={() => setHoverRemove(true)}
          onMouseLeave={() => setHoverRemove(false)}
          onClick={() => {
            handleSave();
            onRemove();
          }}
          style={{
            background: hoverRemove ? "#d32f2f" : "#f44336",
            color: "#fff",
            border: "none",
            padding: "6px 10px",
            fontSize: "0.9rem",
            borderRadius: 4,
            cursor: "pointer",
            transition: "background-color 0.25s ease",
          }}
        >
          Remove Box
        </button>
      </div>
    </div>
  );
}
