import styles from "../Editor.module.css";
import ButtonDisplays from "./buttons/ButtonDisplays";
import Header from "./Header";
import Content from "./Content";
import { BoxEditorType } from "../../shared/types";
import { useState } from "react";
import {
  useEditorAutoSave as useModule,
  useGlobalStates,
  usePrimitiveStates,
  useFunctionStates,
  useCollectionSingleStates,
  useCollectionPairsStates,
  useElementIdState,
  useClassStates,
  useInvalidatedState,
  useGlobalRefs,
} from "../hooks/useEditor";

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

  // Function name list for the selector panel — seeded with __init__ by default
  const [functionNames, setFunctionNames] = useState<string[]>(["__init__"]);
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

      {/* Top section: header with id, type, name + close button */}
      <Header
        element={metadata}
        dataType={dataType}
        setDataType={setDataType}
        value={contentValue}
        setValue={setContentValue}
        functionName={functionName}
        setFunctionName={setFunctionName}
        functionNames={functionNames}
        setFunctionNames={setFunctionNames}
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
        onClose={onClose}
      />

      {/* Middle section: editable content */}
      <div className={styles.contentArea}>
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
          elements={elements}
        />
      </div>

      {/* Bottom section: action buttons */}
      <div className={styles.footerRow}>
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
    </div>
  );
};

export default BoxEditorModule;
