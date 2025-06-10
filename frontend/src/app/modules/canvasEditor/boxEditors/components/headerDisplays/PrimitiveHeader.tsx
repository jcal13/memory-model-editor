import IdDisplay from "./components/IdDisplay";
import TypeSelector from "./components/TypeSelector";

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
  <>
    <IdDisplay element={element} />
    <TypeSelector
      dataType={dataType}
      setDataType={setDataType}
      value={value}
      setValue={setValue}
    />
  </>
);

export default PrimitiveHeader;
