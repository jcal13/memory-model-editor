import styles from "../Editor.module.css";
import ButtonDisplays from "./buttons/ButtonDisplays";
import Header from "./Header";
import Content from "./Content";
import { useModule } from "../hooks/useEffect";
import {
  useGlobalStates,
  usePrimitiveStates,
  useFunctionStates,
  useCollectionSingleStates,
  useCollectionPairsStates,
  useElementIdState,
  useClassStates,
  useInvalidatedState,
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
const BoxEditorModule = ({
  metadata,
  onSave,
  onRemove,
  onClose,
  ids,
  addId,
  removeId,
  classes,
  addClasses,
  removeClasses,
  sandbox = true,
  elements = [],
}: BoxEditorType) => {
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

  // State hook for element class
  const [
    ownClassName,
    setOwnClassName,
    ownClassVariables,
    setOwnClassVariables,
  ] = useClassStates(metadata);

  const [invalidated, setInvalidated] = useInvalidatedState(metadata);
  // -----------------------------------

  const collectionData =
    metadata.kind.name === "dict" ? collectionPairs : collectionItems;

  // Hook to sync the module and apply save logic when clicking outside
  useModule(
    onSave,
    metadata,
    ownId,
    dataType,
    contentValue,
    functionName,
    functionParams,
    collectionData,
    ownClassName,
    ownClassVariables,
    invalidated
  );
  return (
    <div ref={moduleRef} className={`drag-handle ${styles.boxEditorModule}`}>
      <button className={styles.removeItem} onClick={onClose}>
        ×
      </button>
      
      {/* Top section: displays type-specific headers (id, selector, name) */}
      <Header
        element={metadata}
        dataType={dataType}
        setDataType={setDataType}
        value={contentValue}
        setValue={setContentValue}
        functionName={functionName}
        setFunctionName={setFunctionName}
        classes={classes}
        ownClasses={ownClassName}
        addClasses={addClasses}
        setOwnClassName={setOwnClassName}
        removeClasses={removeClasses}
        ids={ids}
        addId={addId}
        ownId={ownId}
        setElementId={setOwnId}
        removeId={removeId}
        sandbox={sandbox}
        elements={elements}
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
        ownClassVariables={ownClassVariables}
        setOwnClassVariables={setOwnClassVariables}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
      />

      {/* Bottom section: shows the remove button */}
      <ButtonDisplays
        element={metadata}
        onSave={onSave}
        onRemove={onRemove}
        dataType={dataType}
        value={contentValue}
        hoverRemove={hoverRemove}
        setHoverRemove={setHoverRemove}
        functionName={functionName}
        functionParams={functionParams}
        className={ownClassName}
        invalidated={invalidated}
        onToggleInvalidate={setInvalidated}
        ownClassVariables={ownClassVariables}
        items={collectionItems}
      />
    </div>
  );
};

export default BoxEditorModule;
