import { useState } from "react";
import EditorModule from "./editorModule";

/**
 * Props for the SetEditor component.
 */
type Props = {
  element: {
    id: string;
    kind: {
      name: string;      // Should be "set"
      type: string;      // Should be "set"
      value: number[];   // Array of object IDs the set refers to
    };
  };
  /**
   * Callback when the user confirms the edits.
   */
  onSave: (data: { name: string; type: string; value: number[] }) => void;

  /**
   * Callback when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * SetEditor is a form UI for editing a "set" type element in the memory model.
 * The user can add or remove references to other elements via their ID numbers.
 */
export default function SetEditor({ element, onSave, onCancel }: Props) {
  // Initialize state with existing value or an empty array
  const [items, setItems] = useState<number[]>(element.kind.value || []);

  /**
   * Updates a specific item (reference ID) at the given index.
   */
  const updateItem = (index: number, newId: number) => {
    const updated = [...items];
    updated[index] = newId;
    setItems(updated);
  };

  /**
   * Adds a new item with a default value (0).
   */
  const addItem = () => setItems([...items, 0]);

  /**
   * Removes the item at the specified index.
   */
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  /**
   * Handles the save action by passing the updated set data to the parent.
   */
  const handleSave = () => {
    onSave({
      name: element.kind.name,
      type: element.kind.type,
      value: items,
    });
  };

  return (
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {/* Render input for each set item */}
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

      {/* Add new set item */}
      <button onClick={addItem}>+ Add</button>
    </EditorModule>
  );
}
