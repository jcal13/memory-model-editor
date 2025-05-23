import { useState, useEffect } from "react";
import { CanvasElement, ElementKind } from "../../types";

interface Props {
  element: CanvasElement;
  onSave: (updatedKind: ElementKind) => void;
  onCancel: () => void;
}

export default function PrimitiveEditor({ element, onSave, onCancel }: Props) {
  const [dataType, setDataType] = useState(element.kind.type);
  const [value, setValue] = useState(element.kind.value);

  useEffect(() => {
    setDataType(element.kind.type);
    setValue(element.kind.value);
  }, [element]);

  const isInt = (v: string) => /^-?\d+$/.test(v);
  const isFloat = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const isBool = (v: string) => v === "true" || v === "false";

  const validByType = () => {
    switch (dataType) {
      case "int":
        return isInt(value);
      case "float":
        return isFloat(value);
      case "bool":
        return isBool(value);
      default:
        return true;
    }
  };

  const handleSave = () => onSave({ name: "primitive", type: dataType, value });

  const handleTypeChange = (newType: typeof dataType) => {
    setDataType(newType);
    if (newType === "bool") setValue("true");
    if (newType === "int" && !isInt(value)) setValue("0");
    if (newType === "float" && !isFloat(value)) setValue("0.0");
  };

  return (
    <div
      className="drag-handle"
      style={{
        zIndex: 1000,
        background: "#fff",
        border: "1px solid #888",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: 12,
        width: 230,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            border: "1px solid #888",
            background: "#f5f5f5",
            padding: "2px 6px",
            fontSize: "0.8rem",
          }}
        >
          {element.id}
        </div>

        <select
          style={{ padding: 4 }}
          value={dataType}
          onChange={(e) => handleTypeChange(e.target.value as typeof dataType)}
        >
          <option value="int">int</option>
          <option value="float">float</option>
          <option value="str">str</option>
          <option value="bool">bool</option>
        </select>
      </div>

      {dataType === "bool" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 8,
          }}
        >
          <label>
            <input
              type="radio"
              checked={value === "true"}
              onChange={() => setValue("true")}
            />
            true
          </label>
          <label>
            <input
              type="radio"
              checked={value === "false"}
              onChange={() => setValue("false")}
            />
            false
          </label>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setValue(e.currentTarget.innerText)}
            style={{
              width: "80%",
              minHeight: 24,
              padding: 4,
              boxSizing: "border-box",
              textAlign: "center",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              border: "1px solid #ccc",
              outline: "none",
            }}
          >
            {value}
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={!validByType()}>
        Save
      </button>
      <button onClick={onCancel} style={{ marginLeft: 4 }}>
        Cancel
      </button>

      {!validByType() && (
        <div style={{ color: "red", marginTop: 6, fontSize: "0.8rem" }}>
          Invalid {dataType} value
        </div>
      )}
    </div>
  );
}
