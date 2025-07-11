import styles from "../../../styles/BoxEditorStyles.module.css";

/**
 * Props for the ClassName component.
 */
interface Props {
  className: any; // Current name of the class (string or any dynamic type)
  setClassName: any; // Setter function to update the class name
}

/**
 * ClassName renders an input box for editing the name of a class.
 *
 * - Displays a text input prefilled with the current class name
 * - Updates the state when the user types in a new name
 */
const ClassName = ({ className, setClassName }: Props) => {
  return (
    <div data-testid="class-header">
      <input
        className={styles.classNameInput}
        placeholder="class name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
      />
    </div>
  );
};

export default ClassName;
