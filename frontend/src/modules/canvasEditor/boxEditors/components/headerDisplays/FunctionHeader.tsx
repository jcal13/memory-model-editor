import FunctionName from "./components/FunctionName";

interface Props {
  functionName: string; // The current name of the function
  setFunctionName: (name: string) => void; // Callback to update the function name
}

/**
 * FunctionHeader is a simple wrapper around the FunctionName input component.
 *
 * It displays an editable input for setting the name of a function-type memory element.
 * Used in function box editors to allow users to rename their function.
 */
const FunctionHeader = ({ functionName, setFunctionName }: Props) => (
  <FunctionName functionName={functionName} setFunctionName={setFunctionName} />
);

export default FunctionHeader;
