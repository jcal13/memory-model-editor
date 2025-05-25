import { useState, useEffect } from "react";
import { CanvasElement, ElementKind } from "../../types";

interface Props {
  element: CanvasElement;
  onSave: (updatedKind: ElementKind) => void;
  onCancel: () => void;
}

export default function FunctionEditor({ element, onSave, onCancel }: Props) {
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
      case "str":
      default:
        return true;
    }
  };

  const isValid = validByType();
  const handleSave = () =>
    onSave({
      name: "function",
      type: dataType,
      value,
    });

  const handleTypeChange = (newType: typeof dataType) => {
    setDataType(newType);
    if (newType === "bool") {
      setValue("true");
    } else if (newType === "int" && !isInt(value)) {
      setValue("0");
    } else if (newType === "float" && !isFloat(value)) {
      setValue("0.0");
    }
  };

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
        width: 230,
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
        {element.id}
      </div>

      <select
        style={{ width: "100%", marginBottom: 8, padding: 4 }}
        value={dataType}
        onChange={(e) => handleTypeChange(e.target.value as typeof dataType)}
      >
        <option value="int">int</option>
        <option value="float">float</option>
        <option value="str">str</option>
        <option value="bool">bool</option>
      </select>

      {dataType === "bool" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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
        <input
          style={{
            width: "100%",
            marginBottom: 8,
            padding: 4,
            boxSizing: "border-box",
          }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
        />
      )}

      <button onClick={handleSave} disabled={!isValid}>
        Save
      </button>
      <button onClick={onCancel} style={{ marginLeft: 4 }}>
        Cancel
      </button>
      {!isValid && (
        <div style={{ color: "red", marginTop: 6, fontSize: "0.8rem" }}>
          Invalid {dataType} value
        </div>
      )}
    </div>
  );
}
