import IdDisplay from "./components/IdDisplay";
import TypeSelector from "./components/TypeSelector";
import styles from "../../styles/BoxEditorStyles.module.css";

interface Props {
  element: any;
  dataType: any;
  setDataType: any;
  value: string;
  setValue: (v: string) => void;
}

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
