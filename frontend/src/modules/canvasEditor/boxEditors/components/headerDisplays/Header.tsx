import styles from "../../styles/BoxEditorStyles.module.css";
import PrimitiveHeader from "./PrimitiveHeader";
import FunctionHeader from "./FunctionHeader";
import CollectionHeader from "./CollectionHeader";
import ClassHeader from "./ClassHeader";
import { PrimitiveType } from "../../../shared/types";
import { ID } from "../../../shared/types";

interface Props {
  element: any; // The memory element being edited, includes its id and kind
  dataType: any; // Current primitive type selected (if applicable)
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>; // Function to update the primitive type
  value: string; // Current value for primitive types
  setValue: React.Dispatch<React.SetStateAction<string>>; // Function to update the value
  functionName: string; // Name of the function (if the element is a function)
  setFunctionName: React.Dispatch<React.SetStateAction<string>>; // Function to update the function name
  // ---- ID SELECTOR PROPS BELOW ----
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
   // ---- CLASS SELECTOR STYLE PROPS BELOW ----
  classes?: string[]; // List of all class names
  addClasses?: (className: string) => void;
  ownClasses?: string; // Current class name for this box
  setElementClass?: (className: string) => void;
  removeClasses?: (className: string) => void;
}

/**
 * Header renders the top section of a box editor, dynamically displaying the
 * appropriate controls depending on the type of the memory element.
 *
 * - For "primitive" types, it shows an ID + type selector and value.
 * - For "function" types, it shows an editable function name.
 * - For collection types ("list", "set", "tuple", "dict"), it shows the ID and type.
 * - For "class" types, it shows a class selector UI.
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
  ownId,
  setElementId,
  removeId,
  sandbox,
  classes = [],
  addClasses = () => {},
  ownClasses = "",
  setElementClass = () => {},
  removeClasses = () => {},
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
          ownId={ownId}
          setElementId={setElementId}
          removeId={removeId}
          sandbox={sandbox}
        />
      )}
      {kind === "function" && (
        <FunctionHeader
          functionName={functionName}
          setFunctionName={setFunctionName}
        />
      )}
      {["list", "set", "tuple", "dict"].includes(kind) && (
        <CollectionHeader
          element={element}
          ids={ids}
          addId={addId}
          ownId={ownId}
          setElementId={setElementId}
          removeId={removeId}
          sandbox={sandbox}
        />
      )}
      {kind === "class" && (
        <ClassHeader
          ids={ids}
          addId={addId}
          ownId={ownId}
          setElementId={setElementId}
          removeId={removeId}
          sandbox={sandbox}
          classes={classes}
          addClasses={addClasses}
          ownClasses={ownClasses}
          setElementClassName={setElementClass}
          removeClasses={removeClasses}
        />
      )}
    </div>
  );
};

export default Header;
