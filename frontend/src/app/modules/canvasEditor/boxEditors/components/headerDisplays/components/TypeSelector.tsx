import styles from "../../../styles/boxEditorStyles.module.css";

type PrimitiveType = "None" | "int" | "float" | "str" | "bool";

interface Props {
  dataType: PrimitiveType;
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>;
  value: string;
  setValue: any;
}

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
