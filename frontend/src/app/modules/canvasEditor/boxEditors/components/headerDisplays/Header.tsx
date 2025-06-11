import styles from "../../styles/BoxEditorStyles.module.css";
import PrimitiveHeader from "./PrimitiveHeader";
import FunctionHeader from "./FunctionHeader";
import CollectionHeader from "./CollectionHeader";
import { PrimitiveType } from "../../../shared/types";

interface Props {
  element: any;
  dataType: PrimitiveType;
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  functionName: string;
  setFunctionName: React.Dispatch<React.SetStateAction<string>>;
}

const Header = ({
  element,
  dataType,
  setDataType,
  value,
  setValue,
  functionName,
  setFunctionName,
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
