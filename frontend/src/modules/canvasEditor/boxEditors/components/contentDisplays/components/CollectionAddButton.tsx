import styles from "../../../styles/BoxEditorStyles.module.css";

/**
 * Props for the CollectionAddButton component.
 */
interface Props {
  mode: "single" | "pair"; // Indicates whether items are individual values or key-value pairs
  items: any[]; // Current collection of items (e.g., list entries or dict pairs)
  setItems: React.Dispatch<React.SetStateAction<any[]>>; // State setter for updating the collection
  buttonText?: string; // Optional custom text for the add button
}

/**
 * CollectionAddButton is a reusable button component that adds a new entry
 * to a collection editor (e.g., list, tuple, set, or dictionary).
 *
 * - In "single" mode: adds `null` as a new element
 * - In "pair" mode: adds a `["", null]` pair (for dict-like structures)
 */
const CollectionAddButton = ({ mode, items, setItems, buttonText }: Props) => {
  /**
   * Handles appending a new item to the collection.
   */
  const handleAdd = () => {
    if (mode === "single") {
      setItems([...items, "_"]);
    } else {
      setItems([...items, ["_", "_"]]);
    }
  };

  // Determine default button label based on mode
  const defaultText = mode === "single" ? "Add Element" : "Add Pair";

  return (
    <div>
      <button className={styles.addButton} onClick={handleAdd}>
        {buttonText ?? defaultText}
      </button>
    </div>
  );
};

export default CollectionAddButton;
