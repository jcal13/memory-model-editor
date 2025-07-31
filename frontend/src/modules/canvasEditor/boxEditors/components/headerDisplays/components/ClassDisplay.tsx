import styles from "../../../styles/BoxEditorStyles.module.css";
import ClassSelector from "../../../../classSelector/classSelector";

/**
 * Props for the ClassDisplay component.
 */
interface Props {
  classes: string[];
  addClassName: (className: string) => void;
  ownClassName: string;
  setElementClassName: (className: string) => void;
  removeClassName: (className: string) => void;
  sandbox: boolean;
}

/**
 * ClassDisplay component shows the class name of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const ClassDisplay = ({
  classes,
  addClassName,
  ownClassName,
  setElementClassName,
  removeClassName,
  sandbox,
}: Props) => (
  <ClassSelector
    classes={classes}
    onAdd={addClassName}
    onSelect={setElementClassName}
    currentClass={ownClassName}
    buttonClassName={styles.moduleIdBox}
    onRemove={removeClassName}
    editable={sandbox}
    sandbox={sandbox}
  />
);

export default ClassDisplay;
