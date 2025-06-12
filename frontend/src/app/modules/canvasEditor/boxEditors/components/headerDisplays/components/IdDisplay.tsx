import styles from "../../../styles/BoxEditorStyles.module.css";
import { PrimitiveKind } from "../../../../shared/types";
import { ID } from "../../../../shared/types";
import IdSelector from "../../../../idSelector/IdSelector";

/**
 * Props for the IdDisplay component.
 */
interface Props {
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
}

/**
 * IdDisplay component shows the ID of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const IdDisplay = ({ ids, addId, ownId, setElementId }: Props) => (
  <IdSelector                              // one-liner wrap
    ids={ids}
    onAdd={addId}
    onSelect={setElementId}
    currentId={ownId}
    buttonClassName={styles.moduleIdBox}
  />
);

export default IdDisplay;
