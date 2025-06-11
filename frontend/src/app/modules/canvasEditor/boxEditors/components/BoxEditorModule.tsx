import styles from "../styles/BoxEditorStyles.module.css";
import RemoveButton from "./buttonDisplays/RemoveButton";
import Header from "./headerDisplays/Header";
import Content from "./contentDisplays/Content";
import { useModule } from "../hooks/useEffect";
import {
  useGlobalStates,
  usePrimitiveStates,
  useFunctionStates,
  useCollectionSingleStates,
  useCollectionPairsStates,
} from "../hooks/useState";
import { BoxEditorType } from "../../shared/types";
import { useGlobalRefs } from "../hooks/useRef";

const BoxEditorModule = ({ metadata, onSave, onRemove }: BoxEditorType) => {
  const { hoverRemove, setHoverRemove } = useGlobalStates();
  const moduleRef = useGlobalRefs();

  const [dataType, setDataType, contentValue, setContentValue] =
    usePrimitiveStates(metadata);
  const [functionName, setFunctionName, functionParams, setFunctionParams] =
    useFunctionStates(metadata);
  const [collectionItems, setCollectionItems] =
    useCollectionSingleStates(metadata);
  const [collectionPairs, setCollectionPairs] =
    useCollectionPairsStates(metadata);

  useModule(
    moduleRef,
    onSave,
    metadata,
    dataType,
    contentValue,
    functionName,
    functionParams,
    collectionItems
  );

  return (
    <div ref={moduleRef} className={`drag-handle ${styles.boxEditorModule}`}>
      <Header
        element={metadata}
        dataType={dataType}
        setDataType={setDataType}
        value={contentValue}
        setValue={setContentValue}
        functionName={functionName}
        setFunctionName={setFunctionName}
      />

      <Content
        metadata={metadata}
        dataType={dataType}
        value={contentValue}
        setValue={setContentValue}
        functionParams={functionParams}
        setFunctionParams={setFunctionParams}
        collectionItems={collectionItems}
        setCollectionItems={setCollectionItems}
        collectionPairs={collectionPairs}
        setCollectionPairs={setCollectionPairs}
      />

      <RemoveButton
        element={metadata}
        onSave={onSave}
        onRemove={onRemove}
        dataType={dataType}
        value={contentValue}
        hoverRemove={hoverRemove}
        setHoverRemove={setHoverRemove}
        functionName={functionName}
        functionParams={functionParams}
        items={collectionItems}
      />
    </div>
  );
};

export default BoxEditorModule;
