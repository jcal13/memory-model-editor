import CollectionItem from "./components/CollectionItem";
import CollectionAddButton from "./components/CollectionAddButton";
import styles from "../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../shared/types";

/**
 * Props for the CollectionContent component.
 */
interface Props {
  mode: "single" | "pair"; // Determines how items should be displayed: as individual values or key-value pairs
  items: any; // The current list or dictionary-like collection
  setItems: any; // The state setter to update the collection
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
}

/**
 * CollectionContent is a wrapper component that combines the visual list of items
 * (`CollectionItem`) with an add button (`CollectionAddButton`) to support adding
 * and removing elements from a collection.
 *
 * - In "single" mode, it manages a list of values.
 * - In "pair" mode, it manages a list of key-value pairs (e.g., for a dict).
 */
const CollectionContent = ({
  mode,
  items,
  setItems,
  ids,
  addId,
  removeId,
  sandbox
}: Props) => {
  return (
    <div className={styles.contentContainer}>
      <CollectionItem
        mode={mode}
        items={items}
        setItems={setItems}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
      />
      <CollectionAddButton mode={mode} items={items} setItems={setItems}/>
    </div>
  );
};

export default CollectionContent;
