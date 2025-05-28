import { useState } from "react";
import EditorModule from "./editorModule";

type Props = {
  element: {
    id: string;
    kind: {
      name: string;
      type: string;
      value: number[];
    };
  };
  onSave: (data: { name: string; type: string; value: number[] }) => void;
  onCancel: () => void;
};

export default function ListEditor({ element, onSave, onCancel }: Props) {
  const [items, setItems] = useState<number[]>(element.kind.value || []);

  const updateItem = (index: number, newId: number) => {
    const updated = [...items];
    updated[index] = newId;
    setItems(updated);
  };

  const addItem = () => setItems([...items, 0]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSave = () => {
    onSave({
      name: element.kind.name, // "list" or "tuple"
      type: element.kind.type,
      value: items,
    });
  };

  return (
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {items.map((id, i) => (
        <div key={i} style={{ display: "flex", marginBottom: 4 }}>
          <input
            type="number"
            value={id}
            onChange={(e) => updateItem(i, Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <button onClick={() => removeItem(i)}>×</button>
        </div>
      ))}
      <button onClick={addItem}>+ Add</button>
    </EditorModule>
  );
}
