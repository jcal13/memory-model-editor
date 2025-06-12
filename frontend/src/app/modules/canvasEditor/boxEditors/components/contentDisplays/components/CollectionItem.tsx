import styles from "../../../styles/BoxEditorStyles.module.css";
import IdSelector from "../../../../idSelector/IdSelector";
import { ID } from "../../../../shared/types";
/**
 * Props for the CollectionItem component.
 */
interface Props {
  mode: "single" | "pair"; // Determines if the collection consists of single elements or key-value pairs
  items: any[]; // Current array of collection items (e.g., list items or dict pairs)
  setItems: React.Dispatch<React.SetStateAction<any[]>>; // State setter to update the collection
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
}

/**
 * CollectionItem displays a list of editable items in either "single" or "pair" mode.
 * - "single": renders a list of individual value boxes (e.g., list, tuple, set)
 * - "pair": renders key-value pairs (e.g., dict), with a ":" separator between key and value
 *
 * Each item includes a "×" button to remove the item from the list.
 */
const CollectionItem = ({ mode, items, setItems, ids, addId, ownId, setElementId }: Props) => {
  /**
   * Removes an item at the given index from the collection.
   * @param idx - Index of the item to remove
   */
  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  // Don't render anything if the collection is empty
  if (items.length === 0) return null;

  // Render collection for "single" mode
  if (mode === "single") {
    return (
      <div className={styles.collectionIdContainer}>
        {items.map((_, idx) => (
          <div key={idx} className={styles.collectionIdBox}>

            <IdSelector                              // one-liner wrap
              ids={ids}
              onAdd={addId}
              onSelect={setElementId}
              currentId={ownId}
              buttonClassName={styles.collectionIdBoxText}
            />
            
            <div className={styles.collectionIdBoxText}>+</div>
            <button
              className={styles.collectionRemoveId}
              onClick={() => removeItem(idx)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Render collection for "pair" mode
  return (
    <div className={styles.collectionPairsContainer}>
      {items.map((_, idx) => (
        <div key={idx} className={styles.collectionPairContainer}>
          <div className={styles.collectionIdBox}>
            <div className={styles.collectionIdBoxText}>+</div>
          </div>
          <div className={styles.collectionPairSeparator}>:</div>
          <div className={styles.collectionIdBox}>
            <div className={styles.collectionIdBoxText}>+</div>
            <button
              className={styles.collectionRemoveId}
              onClick={() => removeItem(idx)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionItem;
