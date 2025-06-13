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
  useElementIdState
} from "../hooks/useState";
import { BoxEditorType } from "../../shared/types";
import { useGlobalRefs } from "../hooks/useRef";

/**
 * BoxEditorModule renders the full editable UI for a memory box,
 * including its header, content section, and remove button.
 * It handles multiple kinds of memory elements: primitive, function, list, tuple, set, and dict.
 *
 * Props:
 * - metadata: the element's structure, including id, kind, and content
 * - onSave: function to call with the updated box data
 * - onRemove: function to call to remove the box from the canvas
 */
const BoxEditorModule = ({ metadata, onSave, onRemove, ids, addId, removeId }: BoxEditorType) => {
  // Shared hover state for remove button
  const { hoverRemove, setHoverRemove } = useGlobalStates();

  // Ref to the entire module, used for drag/close handling
  const moduleRef = useGlobalRefs();

  // State hook for element id
  const [ownId, setOwnId] = useElementIdState(metadata);

  // State hooks for different box types
  const [dataType, setDataType, contentValue, setContentValue] =
    usePrimitiveStates(metadata);
  const [functionName, setFunctionName, functionParams, setFunctionParams] =
    useFunctionStates(metadata);
  const [collectionItems, setCollectionItems] =
    useCollectionSingleStates(metadata);
  const [collectionPairs, setCollectionPairs] =
    useCollectionPairsStates(metadata);


  const collectionData = metadata.kind.name === "dict" ? collectionPairs : collectionItems;

  // Hook to sync the module and apply save logic when clicking outside
  useModule(
    moduleRef,
    onSave,
    metadata,
    ownId,
    dataType,
    contentValue,
    functionName,
    functionParams,
    collectionData
  );

  return (
    <div ref={moduleRef} className={`drag-handle ${styles.boxEditorModule}`}>
      {/* Top section: displays type-specific headers (id, selector, name) */}
      <Header
        element={metadata}
        dataType={dataType}
        setDataType={setDataType}
        value={contentValue}
        setValue={setContentValue}
        functionName={functionName}
        setFunctionName={setFunctionName}
        ids={ids}
        addId={addId}
        ownId={ownId}
        setElementId={setOwnId}
        removeId={removeId}
      />

      {/* Middle section: displays the input or editable content for the box */}
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
        ids={ids}
        addId={addId}
        removeId={removeId}
      />

      {/* Bottom section: shows the remove button */}
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
