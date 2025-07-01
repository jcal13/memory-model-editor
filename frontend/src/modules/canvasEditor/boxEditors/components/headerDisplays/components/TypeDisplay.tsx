import styles from "../../../styles/BoxEditorStyles.module.css";

/**
 * Props for the TypeDisplay component.
 */
interface Props {
  typeLabel: any; // Label indicating the type of the memory element (e.g., "int", "list", "function")
}

/**
 * TypeDisplay component renders the type label of a memory element.
 *
 * This is typically shown alongside the ID to indicate the data type or structure of the element.
 */
const TypeDisplay = ({ typeLabel }: Props) => {
  return <div className={styles.typeDisplay}>{typeLabel}</div>;
};

export default TypeDisplay;
