import styles from "../../../styles/BoxEditorStyles.module.css";
import { PrimitiveKind } from "../../../../shared/types";

/**
 * Props for the IdDisplay component.
 */
interface Props {
  element: {
    id: string; // The unique identifier for the element
    kind: PrimitiveKind; // The kind of the primitive element
  };
}

/**
 * IdDisplay component shows the ID of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const IdDisplay = ({ element }: Props) => {
  return <div className={styles.moduleIdBox}>ID&nbsp;{element.id}</div>;
};

export default IdDisplay;
