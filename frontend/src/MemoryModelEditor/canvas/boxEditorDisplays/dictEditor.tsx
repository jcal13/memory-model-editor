import { useState } from "react";
import EditorModule from "./editorModule";

/**
 * Props for the DictEditor component.
 */
type Props = {
  element: {
    id: string;
    kind: {
      name: string; // should be "dict"
      type: string; // should be "dict"
      value: Record<string, number | null>; // key-value pairs where value is an ID or null
    };
  };
  /**
   * Callback when the user saves their changes.
   */
  onSave: (data: {
    name: string;
    type: string;
    value: Record<string, number | null>;
  }) => void;
  /**
   * Callback when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * A form-based editor for a dictionary object, where keys are strings and
 * values are references to other object IDs (or null).
 *
 * Allows users to dynamically add, edit, or remove entries in the dictionary.
 */
export default function DictEditor({ element, onSave, onCancel }: Props) {
  /**
   * Internal state to manage dictionary entries as [key, id] tuples.
   */
  const [entries, setEntries] = useState(
    Object.entries(element.kind.value || {})
  );

  /**
   * Updates a specific dictionary entry at the given index.
   * @param index - The index of the entry to update.
   * @param key - The new key string.
   * @param id - The new target ID (or null).
   */
  const updateEntry = (index: number, key: string, id: number | null) => {
    const updated = [...entries];
    updated[index] = [key, id];
    setEntries(updated);
  };

  /**
   * Adds a new empty entry to the dictionary.
   */
  const addEntry = () => setEntries([...entries, ["", null]]);

  /**
   * Removes an entry from the dictionary at the given index.
   * @param index - The index of the entry to remove.
   */
  const removeEntry = (index: number) =>
    setEntries(entries.filter((_, i) => i !== index));

  /**
   * Handles the save action, preparing the output dictionary object.
   * Filters out entries with blank keys.
   */
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
