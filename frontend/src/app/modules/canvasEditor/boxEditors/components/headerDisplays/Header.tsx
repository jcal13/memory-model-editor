import styles from "../../styles/BoxEditorStyles.module.css";
import PrimitiveHeader from "./PrimitiveHeader";
import FunctionHeader from "./FunctionHeader";
import CollectionHeader from "./CollectionHeader";
import { PrimitiveType } from "../../../shared/types";
import { ID } from "../../../shared/types";

interface Props {
  element: any; // The memory element being edited, includes its id and kind
  dataType: PrimitiveType; // Current primitive type selected (if applicable)
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>; // Function to update the primitive type
  value: string; // Current value for primitive types
  setValue: React.Dispatch<React.SetStateAction<string>>; // Function to update the value
  functionName: string; // Name of the function (if the element is a function)
  setFunctionName: React.Dispatch<React.SetStateAction<string>>; // Function to update the function name
  ids: ID[];
  addId: (id: ID) => void;
  setElementId: (id: ID) => void;
}

/**
 * Header renders the top section of a box editor, dynamically displaying the
 * appropriate controls depending on the type of the memory element.
 *
 * - For "primitive" types, it shows an ID + type selector and value.
 * - For "function" types, it shows an editable function name.
 * - For collection types ("list", "set", "tuple", "dict"), it shows the ID and type.
 */
const Header = ({
  element,
  dataType,
  setDataType,
  value,
  setValue,
  functionName,
  setFunctionName,
  ids, 
  addId,
  setElementId
}: Props) => {
  const kind = element.kind.name;

  return (
    <div className={styles.header}>
      {kind === "primitive" && (
        <PrimitiveHeader
          element={element}
          dataType={dataType}
          setDataType={setDataType}
          value={value}
          setValue={setValue}
          ids={ids}
          addId={addId}
          setElementId={setElementId}
        />
      )}
      {kind === "function" && (
        <FunctionHeader
          functionName={functionName}
          setFunctionName={setFunctionName}
        />
      )}
      {["list", "set", "tuple", "dict"].includes(kind) && (
        <CollectionHeader element={element} />
      )}
    </div>
  );
};

export default Header;
