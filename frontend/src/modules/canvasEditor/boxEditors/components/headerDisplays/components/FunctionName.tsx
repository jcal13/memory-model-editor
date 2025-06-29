import styles from "../../../styles/BoxEditorStyles.module.css";

/**
 * Props for the FunctionName component.
 */
interface Props {
  functionName: any; // Current name of the function (string or any dynamic type)
  setFunctionName: any; // Setter function to update the function name
}

/**
 * FunctionName renders an input box for editing the name of a function.
 *
 * - Displays a text input prefilled with the current function name
 * - Updates the state when the user types in a new name
 */
const FunctionName = ({ functionName, setFunctionName }: Props) => {
  return (
    <div data-testid="function-header">
      <input
        className={styles.functionNameInput}
        placeholder="function name"
        value={functionName}
        onChange={(e) => setFunctionName(e.target.value)}
      />
    </div>
  );
};

export default FunctionName;
