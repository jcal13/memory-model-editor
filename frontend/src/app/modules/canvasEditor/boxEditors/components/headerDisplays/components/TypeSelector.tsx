import styles from "../../../styles/BoxEditorStyles.module.css";

// Represents the set of supported primitive data types.
type PrimitiveType = "None" | "int" | "float" | "str" | "bool";

/**
 * Props for the TypeSelector component.
 */
interface Props {
  dataType: PrimitiveType; // Currently selected data type
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>; // Updates the selected data type
  value: string; // Current value associated with the data type
  setValue: any; // Updates the value; type could be narrowed to React.Dispatch<React.SetStateAction<string>>
}

/**
 * TypeSelector component allows the user to select a primitive data type (e.g., int, float, bool).
 *
 * It ensures that the associated value is reset or coerced appropriately based on the selected type.
 * For example, selecting "int" when the value is invalid will reset the value to "0".
 */
const TypeSelector = ({ dataType, setDataType, value, setValue }: Props) => {
  const int = (v: string) => /^-?\d+$/.test(v);
  const float = (v: string) => /^-?\d+(\.\d+)?$/.test(v);

  const changeType = (t: PrimitiveType) => {
    setDataType(t);
    if (t === "bool") {
      setValue("true");
    } else if (t === "int" && !int(value)) {
      setValue("0");
    } else if (t === "float" && !float(value)) {
      setValue("0.0");
    } else if (t === "None") {
      setValue("None");
    }
  };

  return (
    <div>
      <select
        className={styles.typeSelector}
        value={dataType}
        onChange={(e) => changeType(e.target.value as PrimitiveType)}
      >
        <option value="None">None</option>
        <option value="int">int</option>
        <option value="float">float</option>
        <option value="str">str</option>
        <option value="bool">bool</option>
      </select>
    </div>
  );
};

export default TypeSelector;
