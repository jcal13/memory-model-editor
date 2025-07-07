import { PrimitiveType } from "../../../shared/types";
import styles from "../../styles/BoxEditorStyles.module.css";

/**
 * Props for the PrimitiveContent component.
 */
interface Props {
  dataType: PrimitiveType; // The type of the primitive value (int, float, bool, str, None)
  value: string; // Current stringified value
  setValue: React.Dispatch<React.SetStateAction<string>>; // Setter for updating the value
}

/**
 * PrimitiveContent renders the input interface for editing a primitive type.
 *
 * - Renders a radio group for boolean types
 * - Displays "None" for NoneType
 * - Provides an input box for other types (int, float, str)
 * - Shows inline validation messages for invalid values
 */
const PrimitiveContent = ({ dataType, value, setValue }: Props) => {
  // Validation helpers for primitive types
  const int = (v: string) => /^-?\d+$/.test(v);
  const float = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const bool = (v: string) => v === "true" || v === "false";

  // Checks if the current value is valid for the given primitive type
  const isValid = () =>
    dataType === "int"
      ? int(value)
      : dataType === "float"
      ? float(value)
      : dataType === "bool"
      ? bool(value)
      : dataType === "None"
      ? value === "None"
      : true;

  return (
    <div>
      {dataType === "bool" ? (
        // Boolean input: radio buttons for "true" and "false"
        <div className={styles.primitiveBoolContainer}>
          {["true", "false"].map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                checked={value === opt}
                onChange={() => setValue(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ) : dataType === "None" ? (
        // Display only for NoneType
        <div className={styles.primitiveNoneContainer}>None</div>
      ) : (
        // Default input field for other primitives
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
          className={styles.primitiveValueContainer}
        />
      )}

      {/* Inline validation message */}
      {!isValid() && (
        <div className={styles.invalidMessage}>
          Invalid&nbsp;{dataType}&nbsp;value
        </div>
      )}
    </div>
  );
};

export default PrimitiveContent;
