import { module } from "../styles/boxEditorStyles";
import RemoveButton from "./buttonDisplays/RemoveButton";
import PrimitiveContent from "./contentDisplays/PrimitiveContent";
import FunctionContent from "./contentDisplays/FunctionContent";
import Header from "./headerDisplays/Header";
import { useDataType, useContentValue, useModule } from "../hooks/useEffect";
import {
  useGlobalStates,
  usePrimitiveStates,
  useFunctionStates,
} from "../hooks/useState";
import { BoxEditorType } from "../../shared/types";
import { usePrimitiveRefs, useGlobalRefs } from "../hooks/useRef";

const BoxEditorModule = ({ metadata, onSave, onRemove }: BoxEditorType) => {
  const { hoverRemove, setHoverRemove } = useGlobalStates();
  const moduleRef = useGlobalRefs();
  let dataType,
    setDataType,
    contentValue,
    setContentValue,
    functionName,
    setFunctionName,
    functionParams,
    setFunctionParams;

  // if (metadata.kind.name == "primitive") {
  [dataType, setDataType, contentValue, setContentValue] =
    usePrimitiveStates(metadata);
  // } else if (metadata.kind.name === "function") {
  [functionName, setFunctionName, functionParams, setFunctionParams] =
    useFunctionStates(metadata);
  // }

  const { dataTypeRef, contentValueRef } = usePrimitiveRefs(
    dataType,
    contentValue
  );

  useDataType(dataTypeRef, dataType);
  useContentValue(contentValueRef, contentValue);
  useModule(moduleRef, dataTypeRef, contentValueRef, onSave, metadata);

  return (
    <div ref={moduleRef} className="drag-handle" style={{ ...module }}>
      <Header
        element={metadata}
        dataType={dataType}
        setDataType={setDataType}
        value={contentValue}
        setValue={setContentValue}
      />

      {metadata.kind.name === "primitive" ? (
        <PrimitiveContent
          dataType={dataType}
          value={contentValue}
          setValue={setContentValue}
        />
      ) : null}

      {metadata.kind.name === "function" ? (
        <FunctionContent
          functionParams={functionParams}
          setParams={setFunctionParams}
        />
      ) : null}

      <RemoveButton
        element={metadata}
        onSave={onSave}
        onRemove={onRemove}
        dataType={dataType}
        value={contentValue}
        hoverRemove={hoverRemove}
        setHoverRemove={setHoverRemove}
      />
    </div>
  );
};

export default BoxEditorModule;
