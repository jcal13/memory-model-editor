import styles from "../../../styles/BoxEditorStyles.module.css";

interface Props {
  mode: "single" | "pair";
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  buttonText?: string;
}

const CollectionAddButton = ({ mode, items, setItems, buttonText }: Props) => {
  const handleAdd = () => {
    if (mode === "single") {
      setItems([...items, null]);
    } else {
      setItems([...items, ["", null]]);
    }
  };

  const defaultText = mode === "single" ? "+ Add Element" : "+ Add Pair";

  return (
    <div>
      <button className={styles.addButton} onClick={handleAdd}>
        {buttonText ?? defaultText}
      </button>
    </div>
  );
};

export default CollectionAddButton;
