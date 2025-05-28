import { useState } from "react";
import EditorModule from "./editorModule";

type Props = {
  element: {
    id: string;
    kind: {
      name: string;
      type: string;
      value: Record<string, number | null>;
    };
  };
  onSave: (data: { name: string; type: string; value: Record<string, number | null> }) => void;
  onCancel: () => void;
};

export default function DictEditor({ element, onSave, onCancel }: Props) {
  const [entries, setEntries] = useState(Object.entries(element.kind.value || {}));

  const updateEntry = (index: number, key: string, id: number | null) => {
    const updated = [...entries];
    updated[index] = [key, id];
    setEntries(updated);
  };

  const addEntry = () => setEntries([...entries, ["", null]]);
  const removeEntry = (index: number) => setEntries(entries.filter((_, i) => i !== index));

  const handleSave = () => {
    const output: Record<string, number | null> = {};
    for (const [k, v] of entries) {
      if (k.trim()) output[k] = v;
    }
    onSave({ name: "dict", type: "dict", value: output });
  };

  return (
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {entries.map(([key, id], i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input
            value={key}
            onChange={(e) => updateEntry(i, e.target.value, id)}
            placeholder="key"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            value={id ?? ""}
            onChange={(e) => updateEntry(i, key, Number(e.target.value))}
            style={{ width: 60 }}
            placeholder="id"
          />
          <button onClick={() => removeEntry(i)}>×</button>
        </div>
      ))}
      <button onClick={addEntry}>+ Add</button>
    </EditorModule>
  );
}
