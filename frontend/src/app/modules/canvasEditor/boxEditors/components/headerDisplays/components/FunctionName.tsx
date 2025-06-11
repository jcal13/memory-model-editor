import styles from "../../../styles/BoxEditorStyles.module.css";

interface Props {
  functionName: any;
  setFunctionName: any;
}

const FunctionName = ({ functionName, setFunctionName }: Props) => {
  return (
    <div>
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
