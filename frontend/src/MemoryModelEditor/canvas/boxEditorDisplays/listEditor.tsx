import { useState } from "react";
import EditorModule from "./editorModule";

/**
 * Props expected by the ListEditor component.
 */
type Props = {
  element: {
    id: string; // Unique ID of the list element
    kind: {
      name: string; // Either "list" or "tuple"
      type: string; // Data type, typically "list" or "tuple"
      value: number[]; // Array of object IDs referenced by the list/tuple
    };
  };
  /**
   * Called when the user saves their edits. Passes updated list/tuple data.
   */
  onSave: (data: { name: string; type: string; value: number[] }) => void;

  /**
   * Called when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * ListEditor allows editing of list-like structures (list or tuple).
 * Users can modify the array of target object IDs, add new items, or remove existing ones.
 */
export default function ListEditor({ element, onSave, onCancel }: Props) {
  // Initialize the state from the passed-in value
  const [items, setItems] = useState<number[]>(element.kind.value || []);

  /**
   * Update the value at a specific index in the list.
   * @param index - Index of the item to update
   * @param newId - New ID to replace the current value at that index
   */
  const updateItem = (index: number, newId: number) => {
    const updated = [...items];
    updated[index] = newId;
    setItems(updated);
  };

  /**
   * Append a new item (default value 0) to the end of the list.
   */
  const addItem = () => setItems([...items, 0]);

  /**
   * Remove the item at a specific index.
   * @param index - Index of the item to remove
   */
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /**
   * Trigger the onSave callback with the current updated list.
   */
  const handleSave = () => {
    onSave({
      name: element.kind.name, // Preserves original name ("list" or "tuple")
      type: element.kind.type,
      value: items,
    });
  };

  return (
    <EditorModule id={Number(element.id)} onSave={handleSave} onCancel={onCancel}>
      {/* Render each item in the list as an editable number input */}
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

      {/* Button to add a new item */}
      <button onClick={addItem}>+ Add</button>
    </EditorModule>
  );
}
