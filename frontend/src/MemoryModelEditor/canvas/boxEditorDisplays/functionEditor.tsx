import { useState } from "react";
import EditorModule from "./editorModule";

/**
 * A single function parameter with a name and an optional target ID.
 */
type Param = {
  name: string;
  targetId: number | null;
};

/**
 * Props expected by the FunctionEditor component.
 */
type Props = {
  element: {
    id: string;
    kind: {
      name: "function"; // Type identifier
      type: "function"; // Data type for internal usage
      value: null; // Placeholder, unused in this editor
      functionName: string; // Display name of the function
      params: Param[]; // List of parameter objects
    };
  };
  /**
   * Called when the user clicks "Save". Passes the updated function data.
   */
  onSave: (data: {
    name: "function";
    type: "function";
    value: null;
    functionName: string;
    params: Param[];
  }) => void;

  /**
   * Called when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * FunctionEditor allows editing of a function's name and parameters.
 * Each parameter includes a name and a reference to a target ID.
 * The user can add, remove, and update these parameters dynamically.
 */
export default function FunctionEditor({ element, onSave, onCancel }: Props) {
  const [name, setName] = useState(element.kind.functionName || "");
  const [params, setParams] = useState<Param[]>(element.kind.params || []);

  /**
   * Update a single property (`name` or `targetId`) of a parameter at a given index.
   * @param index - The index of the parameter to update
   * @param key - The field of the Param object to update
   * @param value - The new value for the field
   */
  const updateParam = (index: number, key: keyof Param, value: string | number) => {
    const updated = [...params];
    updated[index] = {
      ...updated[index],
      [key]: key === "targetId" ? Number(value) : value,
    };
    setParams(updated);
  };

  /**
   * Add a new blank parameter.
   */
  const addParam = () => setParams([...params, { name: "", targetId: null }]);

  /**
   * Remove a parameter from the list.
   * @param index - The index of the parameter to remove
   */
  const removeParam = (index: number) =>
    setParams(params.filter((_, i) => i !== index));

  /**
   * Handle the Save button click by calling the onSave prop with updated data.
   */
  const handleSave = () => {
    onSave({
      name: "function",
      type: "function",
      value: null,
      functionName: name,
      params,
    });
  };

  return (
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {/* Function name input */}
      <input
        placeholder="Function name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      {/* Dynamic list of parameters */}
      {params.map((param, i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          <input
            placeholder="param name"
            value={param.name}
            onChange={(e) => updateParam(i, "name", e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            value={param.targetId ?? ""}
            placeholder="target id"
            onChange={(e) => updateParam(i, "targetId", e.target.value)}
            style={{ width: 80 }}
          />
          <button onClick={() => removeParam(i)}>×</button>
        </div>
      ))}

      {/* Add parameter button */}
      <button onClick={addParam}>+ Add Variable</button>
    </EditorModule>
  );
}
