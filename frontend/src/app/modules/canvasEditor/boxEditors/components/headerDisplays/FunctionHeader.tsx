import FunctionName from "./components/FunctionName";

interface Props {
  functionName: string;
  setFunctionName: (name: string) => void;
}

const FunctionHeader = ({ functionName, setFunctionName }: Props) => (
  <FunctionName functionName={functionName} setFunctionName={setFunctionName} />
);

export default FunctionHeader;
