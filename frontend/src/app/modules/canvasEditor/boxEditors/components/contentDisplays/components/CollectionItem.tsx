import styles from "../../../styles/BoxEditorStyles.module.css";
import IdSelector from "../../../../idSelector/IdSelector";
import { ID } from "../../../../shared/types";

/**
 * Props for the CollectionItem component.
 */
interface Props {
  mode: "single" | "pair";
  items: any[]; // list / set / tuple OR dict pairs
  setItems: React.Dispatch<React.SetStateAction<any[]>>; // updates collectionItems in BoxEditorModule
  ids: any; // global ID pool
  addId: (id: ID) => void; // adds a new ID to the pool
  removeId: (id: ID) => void;
}

/**
 * Renders the entire collection (not a single slot) so the caller
 * only has to supply `items` and `setItems`.
 */
const CollectionItem = ({
  mode,
  items,
  setItems,
  ids,
  addId,
  removeId,
}: Props) => {
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  if (items.length === 0) return null;

  // SINGLE ELEMENTS (list / set / tuple)
  if (mode === "single") {
    return (
      <div className={styles.collectionIdContainer}>
        {items.map((itemId: ID, idx: number) => (
          <div key={idx} className={styles.collectionIdBox}>
            <IdSelector
              currentId={itemId}
              ids={ids}
              onAdd={addId}
              onSelect={(picked) =>
                setItems((prev) => prev.map((v, i) => (i === idx ? picked : v)))
              }
              onRemove={removeId}
              buttonClassName={styles.collectionIdNoBorder}
            />
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

  // PAIRS (dict)
  return (
    <div className={styles.collectionPairsContainer}>
      {items.map(([keyId, valId]: [ID, ID], idx: number) => (
        <div key={idx} className={styles.collectionPairContainer}>
          {/* KEY ID */}
          <div className={styles.collectionIdBox}>
            <IdSelector
              currentId={keyId}
              ids={ids}
              onAdd={addId}
              onSelect={(picked) =>
                setItems((prev) =>
                  prev.map((p, i) => (i === idx ? [picked, p[1]] : p))
                )
              }
              buttonClassName={styles.collectionIdNoBorder}
            />
          </div>

          <div className={styles.collectionPairSeparator}>:</div>

          {/* VALUE ID + REMOVE */}
          <div className={styles.collectionIdBox}>
            <IdSelector
              currentId={valId}
              ids={ids}
              onAdd={addId}
              onSelect={(picked) =>
                setItems((prev) =>
                  prev.map((p, i) => (i === idx ? [p[0], picked] : p))
                )
              }
              buttonClassName={styles.collectionIdNoBorder}
            />
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
