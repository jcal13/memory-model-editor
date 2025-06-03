import { useState, useEffect } from "react";
import EditorModule from "./editorModule";

/**
 * Props for the PrimitiveEditor component.
 */
type Props = {
  element: {
    id: string;
    kind: {
      name: "primitive";
      type: "int" | "float" | "str" | "bool";
      value: string;
    };
  };
  /**
   * Called when the user confirms their changes.
   */
  onSave: (data: {
    name: "primitive";
    type: "int" | "float" | "str" | "bool";
    value: string;
  }) => void;

  /**
   * Called when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * PrimitiveEditor allows users to configure a single primitive value
 * such as an integer, float, string, or boolean. It dynamically validates
 * and formats input based on the selected type.
 */
export default function PrimitiveEditor({ element, onSave, onCancel }: Props) {
  const [dataType, setDataType] = useState(element.kind.type);
  const [value, setValue] = useState(element.kind.value);

  // Update editor state when a new element is selected
  useEffect(() => {
    setDataType(element.kind.type);
    setValue(element.kind.value);
  }, [element]);

  // Validation helpers
  const isInt = (v: string) => /^-?\d+$/.test(v);
  const isFloat = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const isBool = (v: string) => v === "true" || v === "false";

  /**
   * Validates the current value according to the selected type.
   */
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

  /**
   * Handles saving the primitive element's data.
   */
  const handleSave = () => {
    onSave({
      name: "primitive",
      type: dataType,
      value: value ?? "",
    });
  };

  /**
   * Updates the type and sets default values accordingly.
   * @param newType - The newly selected data type
   */
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
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {/* Top row: ID on the left, type dropdown on the right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >

        {/* Type selector dropdown in top-right */}
        <select
          value={dataType}
          onChange={(e) =>
            handleTypeChange(e.target.value as typeof dataType)
          }
          style={{
            padding: 4,
            fontSize: "0.9rem",
          }}
        >
          <option value="int">int</option>
          <option value="float">float</option>
          <option value="str">str</option>
          <option value="bool">bool</option>
        </select>
      </div>

      {/* Centered input or boolean radio buttons */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        {dataType === "bool" ? (
          <div
            style={{
              display: "inline-flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <label>
              <input
                type="radio"
                checked={value === "true"}
                onChange={() => setValue("true")}
                style={{ marginRight: 4 }}
              />
              true
            </label>
            <label>
              <input
                type="radio"
                checked={value === "false"}
                onChange={() => setValue("false")}
                style={{ marginRight: 4 }}
              />
              false
            </label>
          </div>
        ) : (
          <input
            style={{
              width: "80%",
              padding: 4,
              boxSizing: "border-box",
            }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="value"
          />
        )}

        {/* Show error if value is invalid */}
        {!isValid && (
          <div
            style={{
              color: "red",
              fontSize: "0.8rem",
              marginTop: 4,
            }}
          >
            Invalid {dataType} value
          </div>
        )}
      </div>

      {/* Bottom-right Remove button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          style={{
            padding: "4px 8px",
            fontSize: "0.9rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={onCancel /* or call a separate remove handler if available */}
        >
          Remove
        </button>
      </div>
    </EditorModule>
  );
}
