import IdDisplay from "./components/IdDisplay";
import TypeSelector from "./components/TypeSelector";
import styles from "../../styles/BoxEditorStyles.module.css";

interface Props {
  element: any; // The primitive memory element, including its id and kind
  dataType: any; // Current primitive type (e.g., int, str, etc.)
  setDataType: (type: any) => void; // Function to update the primitive type
  value: string; // Current value of the primitive
  setValue: (v: string) => void; // Function to update the value
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
}: Props) => (
  <div className={styles.header}>
    <IdDisplay element={element} />
    <TypeSelector
      dataType={dataType}
      setDataType={setDataType}
      value={value}
      setValue={setValue}
    />
  </div>
);

export default PrimitiveHeader;
