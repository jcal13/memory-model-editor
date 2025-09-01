import styles from "../../Editor.module.css";
import ClassSelector from "../../classEditor/classEditor";

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
 * ObjectDisplay component shows the object's name of a memory element in a styled box.
 *
 * This is useful for labeling visualized memory boxes in the editor UI.
 */
const ObjectDisplay = ({
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

export default ObjectDisplay;
