import { useState } from "react";
import EditorModule from "./editorModule";

/**
 * Props for the TupleEditor component.
 */
type Props = {
  element: {
    id: string;
    kind: {
      name: string;     // Should be "tuple"
      type: string;     // Should be "tuple"
      value: number[];  // Ordered list of referenced object IDs
    };
  };
  /**
   * Called when the user saves their changes to the tuple.
   */
  onSave: (data: { name: string; type: string; value: number[] }) => void;

  /**
   * Called when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * TupleEditor allows users to modify the elements of a tuple in a memory model.
 * Each item in the tuple is a reference to another object (by its ID).
 */
export default function TupleEditor({ element, onSave, onCancel }: Props) {
  // Initialize state from the given tuple value (defaulting to an empty array)
  const [items, setItems] = useState<number[]>(element.kind.value || []);

  /**
   * Updates a specific item in the tuple by index.
   */
  const updateItem = (index: number, newId: number) => {
    const updated = [...items];
    updated[index] = newId;
    setItems(updated);
  };

  /**
   * Adds a new default item (0) to the end of the tuple.
   */
  const addItem = () => setItems([...items, 0]);

  /**
   * Removes the item at the specified index.
   */
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  /**
   * Saves the edited tuple back to the parent component.
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
      {/* Render a row for each item in the tuple */}
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
