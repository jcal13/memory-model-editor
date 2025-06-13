import styles from "../../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../../shared/types";
import IdSelector from "../../../../idSelector/IdSelector";

/**
 * Props for the IdDisplay component.
 */
interface Props {
  ids: any;
  addId: (id: ID) => void;
  ownId: any;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
}

/**
 * IdDisplay component shows the ID of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const IdDisplay = ({ ids, addId, ownId, setElementId, removeId }: Props) => (
  <IdSelector // one-liner wrap
    ids={ids}
    onAdd={addId}
    onSelect={setElementId}
    currentId={ownId}
    buttonClassName={styles.moduleIdBox}
    onRemove={removeId}
  />
);

export default IdDisplay;
