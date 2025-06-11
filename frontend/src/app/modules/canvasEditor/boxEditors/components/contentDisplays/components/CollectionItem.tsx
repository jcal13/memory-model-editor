import styles from "../../../styles/boxEditorStyles.module.css";

interface Props {
  mode: "single" | "pair";
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const CollectionItem = ({ mode, items, setItems }: Props) => {
  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  if (items.length === 0) return null;

  if (mode === "single") {
    return (
      <div className={styles.collectionIdContainer}>
        {items.map((_, idx) => (
          <div key={idx} className={styles.collectionIdBox}>
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
