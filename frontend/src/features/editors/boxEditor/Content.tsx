import PrimitiveContent from "./primitiveBoxes/PrimitiveContent";
import FunctionContent from "./functionBoxes/FunctionContent";
import CollectionContent from "./collectionBoxes/CollectionContent";
import ClassContent from "./classBoxes/ClassContent";
import type { Dispatch, SetStateAction } from "react";
import { BoxType, ID, VisualStyle } from "../../shared/types";

/**
 * Props for the Content component.
 */
interface Props {
  metadata: any; // The full metadata of the current box, including its kind
  dataType: any; // The selected data type (used for primitive types)
  value: string; // The value for primitive types
  setValue: any; // Setter for primitive value
  functionName: string;
  functionParams: any; // Parameter list for function boxes
  setFunctionParams: any; // Setter for function parameters
  collectionItems: any; // List/set/tuple items
  setCollectionItems: any; // Setter for collection items
  collectionPairs: any; // Key-value pairs for dicts
  setCollectionPairs: any; // Setter for dict pairs
  className: string;
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
  ownClassVariables: any;
  setOwnClassVariables: any;
  sandbox: boolean;
  elements?: any[]; // All canvas elements for ID usage tracking
  visualStyle?: VisualStyle;
  onCommitKind?: (kind: BoxType) => void;
  onElementsChange?: Dispatch<SetStateAction<any[]>>;
}

/**
 * Content is a dynamic renderer that determines which specific editor
 * component to show based on the type (`kind`) of the box.
 *
 * - Renders `PrimitiveContent` for primitive boxes.
 * - Renders `FunctionContent` for function boxes.
 * - Renders `CollectionContent` for lists, sets, and tuples (mode: "single").
 * - Renders `CollectionContent` for dicts (mode: "pair").
 */
const Content = ({
  metadata,
  dataType,
  value,
  setValue,
  functionName,
  functionParams,
  setFunctionParams,
  collectionItems,
  setCollectionItems,
  collectionPairs,
  setCollectionPairs,
  className,
  ownClassVariables,
  setOwnClassVariables,
  ids,
  addId,
  removeId,
  sandbox,
  elements = [],
  visualStyle = "memoryviz",
  onCommitKind,
  onElementsChange,
}: Props) => {
  const kind = metadata.kind.name;

  if (kind === "primitive") {
    return (
      <PrimitiveContent dataType={dataType} value={value} setValue={setValue} />
    );
  }

  if (kind === "function") {
    return (
      <FunctionContent
        functionParams={functionParams}
        setParams={setFunctionParams}
        functionName={functionName}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
        validationErrors={metadata.errors}
        elements={elements}
        ownerElement={metadata}
        visualStyle={visualStyle}
        onCommitKind={onCommitKind}
        onElementsChange={onElementsChange}
      />
    );
  }

  if (["list", "set", "tuple"].includes(kind)) {
    return (
      <CollectionContent
        mode="single"
        items={collectionItems}
        setItems={setCollectionItems}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
        validationErrors={metadata.errors}
        elements={elements}
        ownerElement={metadata}
        visualStyle={visualStyle}
        onCommitKind={onCommitKind}
        onElementsChange={onElementsChange}
      />
    );
  }

  if (kind === "dict") {
    return (
      <CollectionContent
        mode="pair"
        items={collectionPairs}
        setItems={setCollectionPairs}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
        validationErrors={metadata.errors}
        elements={elements}
        ownerElement={metadata}
        visualStyle={visualStyle}
        onCommitKind={onCommitKind}
        onElementsChange={onElementsChange}
      />
    );
  }

  if (kind == "class") {
    return (
      <ClassContent
        classVariables={ownClassVariables}
        setVariables={setOwnClassVariables}
        className={className}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={sandbox}
        validationErrors={metadata.errors}
        elements={elements}
        ownerElement={metadata}
        visualStyle={visualStyle}
        onCommitKind={onCommitKind}
        onElementsChange={onElementsChange}
      />
    );
  }

  return null;
};

export default Content;
