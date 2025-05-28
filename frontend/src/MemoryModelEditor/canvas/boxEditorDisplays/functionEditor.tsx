import { useState } from "react";
import EditorModule from "./editorModule";

type Param = { name: string; targetId: number | null };

type Props = {
  element: {
    id: string;
    kind: {
      name: "function";
      type: "function";
      value: null;
      functionName: string;
      params: Param[];
    };
  };
  onSave: (data: {
    name: "function";
    type: "function";
    value: null;
    functionName: string;
    params: Param[];
  }) => void;
  onCancel: () => void;
};

export default function FunctionEditor({ element, onSave, onCancel }: Props) {
  const [name, setName] = useState(element.kind.functionName || "");
  const [params, setParams] = useState<Param[]>(element.kind.params || []);

  const updateParam = (index: number, key: keyof Param, value: string | number) => {
    const updated = [...params];
    updated[index] = {
      ...updated[index],
      [key]: key === "targetId" ? Number(value) : value,
    };
    setParams(updated);
  };

  const addParam = () => setParams([...params, { name: "", targetId: null }]);
  const removeParam = (index: number) => setParams(params.filter((_, i) => i !== index));

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
      <input
        placeholder="Function name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

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

      <button onClick={addParam}>+ Add Variable</button>
    </EditorModule>
  );
}
