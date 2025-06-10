import { pillBase } from "../../../styles/boxEditorStyles";

interface Props {
  functionName: any;
  setFunctionName: any;
}

const FunctionName = ({ functionName, setFunctionName }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: 10,
        borderBottom: "1px solid #ddd",
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
      }}
    >
      <input
        style={{
          ...pillBase,
          width: 160,
          height: 40,
          padding: "0 10px",
          fontSize: "0.9rem",
        }}
        placeholder="function name"
        value={functionName}
        onChange={(e) => setFunctionName(e.target.value)}
      />
    </div>
  );
};

export default FunctionName;
