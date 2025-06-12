import IdDisplay from "./components/IdDisplay";
import TypeSelector from "./components/TypeSelector";
import styles from "../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../shared/types";

interface Props {
  element: any; // The primitive memory element, including its id and kind
  dataType: any; // Current primitive type (e.g., int, str, etc.)
  setDataType: (type: any) => void; // Function to update the primitive type
  value: string; // Current value of the primitive
  setValue: (v: string) => void; // Function to update the value
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
}

/**
 * PrimitiveHeader displays the top section of a primitive-type box editor.
 * It shows the element ID and a dropdown to select the data type (e.g., int, str).
 * Changing the type updates the associated value using `setValue`.
 */
const PrimitiveHeader = ({
  element,
  dataType,
  setDataType,
  value,
  setValue,
  ids, 
  addId,
  ownId,
  setElementId
}: Props) => (
  <div className={styles.header}>
    <IdDisplay element={element}  ids={ids} addId={addId} ownId={ownId} setElementId={setElementId} />
    <TypeSelector
      dataType={dataType}
      setDataType={setDataType}
      value={value}
      setValue={setValue}
    />
  </div>
);

export default PrimitiveHeader;
