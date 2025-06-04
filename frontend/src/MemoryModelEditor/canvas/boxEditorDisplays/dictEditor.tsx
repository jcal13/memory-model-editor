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
      value: Record<number, number | null>; // key-value pairs: id -> id | null
    };
  };
  /**
   * Callback when the user saves their changes.
   */
  onSave: (data: {
    name: string;
    type: string;
    value: Record<number, number | null>;
  }) => void;
  /**
   * Callback when the user cancels editing.
   */
  onCancel: () => void;
};

/**
 * A form-based editor for a dictionary object, where keys and values are both
 * object IDs (numbers). Keys must be valid numbers and unique.
 */
export default function DictEditor({ element, onSave, onCancel }: Props) {
  /**
   * Internal state to manage dictionary entries as [keyID, valueID] pairs.
   */
  const [entries, setEntries] = useState<[number, number | null][]>(
    Object.entries(element.kind.value || {}).map(([k, v]) => [Number(k), v])
  );

  /**
   * Updates a specific dictionary entry at the given index.
   */
  const updateEntry = (index: number, key: number, value: number | null) => {
    const updated = [...entries];
    updated[index] = [key, value];
    setEntries(updated);
  };

  /**
   * Adds a new empty entry to the dictionary.
   */
  const addEntry = () => setEntries([...entries, [0, null]]);

  /**
   * Removes an entry from the dictionary at the given index.
   */
  const removeEntry = (index: number) =>
    setEntries(entries.filter((_, i) => i !== index));

  /**
   * Handles saving: filters duplicates and blank keys.
   */
  const handleSave = () => {
    const output: Record<number, number | null> = {};
    for (const [k, v] of entries) {
      if (!isNaN(k)) output[k] = v;
    }
    onSave({ name: "dict", type: "dict", value: output });
  };

  return (
    <EditorModule
      id={Number(element.id)}
      onSave={handleSave}
      onCancel={onCancel}
    >
      {entries.map(([key, val], i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input
            type="number"
            value={key}
            onChange={(e) => updateEntry(i, Number(e.target.value), val)}
            placeholder="key id"
            style={{ width: 80 }}
          />
          <input
            type="number"
            value={val ?? ""}
            onChange={(e) =>
              updateEntry(
                i,
                key,
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder="value id"
            style={{ width: 80 }}
          />
          <button onClick={() => removeEntry(i)}>×</button>
        </div>
      ))}
      <button onClick={addEntry}>+ Add</button>
    </EditorModule>
  );
}
