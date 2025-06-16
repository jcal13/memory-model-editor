import PrimitiveContent from "./PrimitiveContent";
import FunctionContent from "./FunctionContent";
import CollectionContent from "./CollectionContent";
import { ID } from "../../../shared/types";

/**
 * Props for the Content component.
 */
interface Props {
  metadata: any; // The full metadata of the current box, including its kind
  dataType: any; // The selected data type (used for primitive types)
  value: string; // The value for primitive types
  setValue: any; // Setter for primitive value
  functionParams: any; // Parameter list for function boxes
  setFunctionParams: any; // Setter for function parameters
  collectionItems: any; // List/set/tuple items
  setCollectionItems: any; // Setter for collection items
  collectionPairs: any; // Key-value pairs for dicts
  setCollectionPairs: any; // Setter for dict pairs
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
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
  functionParams,
  setFunctionParams,
  collectionItems,
  setCollectionItems,
  collectionPairs,
  setCollectionPairs,
  ids,
  addId,
  removeId,
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
        ids={ids}
        addId={addId}
        removeId={removeId}
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
      />
    );
  }

  return null;
};

export default Content;
