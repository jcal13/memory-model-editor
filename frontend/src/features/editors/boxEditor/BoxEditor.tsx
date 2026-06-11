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
  canManageClasses = sandbox,
  canManageFunctions = sandbox,
  elements = [],
  questionFunctionNames,
  isLockedMainFrame = false,
  reservedFunctionNames,
  visualStyle = "memoryviz",
  pythonTutorStandalonePrimitives = false,
  onElementsChange,
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

  // Function name list for the selector panel.
  // In practice mode (non-sandbox), pre-populate with the question's function names.
  // In sandbox mode, seed with __main__ as a default.
  const [functionNames, setFunctionNames] = useState<string[]>(() => {
    if (!sandbox && questionFunctionNames && questionFunctionNames.length > 0) {
      return questionFunctionNames;
    }
    return ["__main__"];
  });
  // -----------------------------------

  const collectionData =
    metadata.kind.name === "dict" ? collectionPairs : collectionItems;

  const commitElementKind = (kind: typeof metadata.kind) => {
    onSave(ownId, kind, invalidated);
  };

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
    invalidated,
  );
  return (
    <div ref={moduleRef} className={styles.boxEditorModule}>
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
        canManageClasses={canManageClasses}
        canManageFunctions={canManageFunctions}
        elements={elements}
        onClose={onClose}
        isLockedMainFrame={isLockedMainFrame}
        reservedFunctionNames={reservedFunctionNames}
      />

      {/* Middle section: editable content */}
      <div className={styles.contentArea}>
        <Content
          metadata={metadata}
          dataType={dataType}
          value={contentValue}
          setValue={setContentValue}
          functionName={functionName}
          functionParams={functionParams}
          setFunctionParams={setFunctionParams}
          collectionItems={collectionItems}
          setCollectionItems={setCollectionItems}
          collectionPairs={collectionPairs}
          setCollectionPairs={setCollectionPairs}
          className={ownClassName}
          ownClassVariables={ownClassVariables}
          setOwnClassVariables={setOwnClassVariables}
          ids={ids}
          addId={addId}
          removeId={removeId}
          sandbox={sandbox}
          elements={elements}
          visualStyle={visualStyle}
          pythonTutorStandalonePrimitives={pythonTutorStandalonePrimitives}
          onCommitKind={commitElementKind}
          onElementsChange={onElementsChange}
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
          disableRemove={isLockedMainFrame}
          disableInvalidate={isLockedMainFrame}
        />
      </div>
    </div>
  );
};

export default BoxEditorModule;
