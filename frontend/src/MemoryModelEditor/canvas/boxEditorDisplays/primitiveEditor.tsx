import { useState, useEffect } from "react";
import EditorModule from "./editorModule";

type Props = {
  element: {
    id: string;
    kind: {
      name: "primitive";
      type: "int" | "float" | "str" | "bool";
      value: string;
    };
  };
  onSave: (data: { name: "primitive"; type: "int" | "float" | "str" | "bool"; value: string }) => void;
  onCancel: () => void;
};

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
      case "str":
      default:
        return true;
    }
  };

  const isValid = validByType();

  const handleSave = () => {
    onSave({
      name: "primitive",
      type: dataType,
      value: value ?? "",
    });
  };

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
      <select
        value={dataType}
        onChange={(e) => handleTypeChange(e.target.value as typeof dataType)}
        style={{ width: "100%", marginBottom: 8, padding: 4 }}
      >
        <option value="int">int</option>
        <option value="float">float</option>
        <option value="str">str</option>
        <option value="bool">bool</option>
      </select>

      {dataType === "bool" ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label>
            <input
              type="radio"
              checked={value === "true"}
              onChange={() => setValue("true")}
            />{" "}
            true
          </label>
          <label>
            <input
              type="radio"
              checked={value === "false"}
              onChange={() => setValue("false")}
            />{" "}
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

      {!isValid && (
        <div style={{ color: "red", fontSize: "0.8rem", marginTop: 4 }}>
          Invalid {dataType} value
        </div>
      )}
    </EditorModule>
  );
}
