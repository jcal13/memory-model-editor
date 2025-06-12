import styles from "../../../styles/BoxEditorStyles.module.css";
import { PrimitiveKind } from "../../../../shared/types";
import { ID } from "../../../../shared/types";
import IdSelector from "../../../../idSelector/IdSelector";

/**
 * Props for the IdDisplay component.
 */
interface Props {
  element: {
    id: string; // The unique identifier for the element
    kind: PrimitiveKind; // The kind of the primitive element
  };
  ids: ID[];
  addId: (id: ID) => void;
  setElementId: (id: ID) => void;
}

/**
 * IdDisplay component shows the ID of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const IdDisplay = ({ element, ids, addId, setElementId }: Props) => (
  <IdSelector                              // one-liner wrap
    ids={ids}
    onAdd={addId}
    onSelect={setElementId}
    label={`ID ${element.id ?? "None"}`}
  />
);

export default IdDisplay;
