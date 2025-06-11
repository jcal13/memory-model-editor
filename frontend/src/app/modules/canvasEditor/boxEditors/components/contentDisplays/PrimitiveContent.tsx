import { PrimitiveType } from "../../../shared/types";
import styles from "../../styles/BoxEditorStyles.module.css";

interface Props {
  dataType: PrimitiveType;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

const PrimitiveContent = ({ dataType, value, setValue }: Props) => {
  const int = (v: string) => /^-?\d+$/.test(v);
  const float = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const bool = (v: string) => v === "true" || v === "false";

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
        <div className={styles.primitiveNoneContainer}>None</div>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
          className={styles.primitiveValueContainer}
        />
      )}

      {!isValid() && <div>Invalid&nbsp;{dataType}&nbsp;value</div>}
    </div>
  );
};

export default PrimitiveContent;
