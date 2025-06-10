import IdDisplay from "./IdDisplay";
import TypeSelector from "./TypeSelector";
import { header } from "../../styles/boxEditorStyles";
import { PrimitiveKind, PrimitiveType } from "../../../shared/types";

interface Props {
  element: { id: string; kind: PrimitiveKind };
  dataType: PrimitiveType;
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

const Header = ({ element, dataType, setDataType, value, setValue }: Props) => {
  return (
    <div style={{ ...header }}>
      <IdDisplay element={element} />

      <TypeSelector
        dataType={dataType}
        setDataType={setDataType}
        value={value}
        setValue={setValue}
      />
    </div>
  );
};

export default Header;
