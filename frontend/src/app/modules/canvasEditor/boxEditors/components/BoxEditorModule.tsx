import { module } from "../styles/boxEditorStyles";
import RemoveButton from "./buttonDisplays/RemoveButton";
import PrimitiveContent from "./contentDisplays/PrimitiveContent";
import Header from "./headerDisplays/Header";
import { useDataType, useContentValue, useModule } from "../hooks/useEffect";
import { useGlobalStates, usePrimitiveStates } from "../hooks/useState";
import { BoxEditorType } from "../../shared/types";
import { useRefs } from "../hooks/useRef";

const BoxEditorModule = ({ metadata, onSave, onRemove }: BoxEditorType) => {
  const { hoverRemove, setHoverRemove } = useGlobalStates();
  const { dataType, setDataType, contentValue, setContentValue } =
    usePrimitiveStates(metadata);

  const { moduleRef, dataTypeRef, contentValueRef } = useRefs(
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

      <PrimitiveContent
        dataType={dataType}
        value={contentValue}
        setValue={setContentValue}
      />

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
