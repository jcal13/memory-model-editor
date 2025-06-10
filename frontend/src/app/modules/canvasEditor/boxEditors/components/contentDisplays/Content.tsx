import PrimitiveContent from "./PrimitiveContent";
import FunctionContent from "./FunctionContent";
import CollectionContent from "./CollectionContent";

interface Props {
  metadata: any;
  dataType: any;
  value: string;
  setValue: any;
  functionParams: any;
  setFunctionParams: any;
  collectionItems: any;
  setCollectionItems: any;
  collectionPairs: any;
  setCollectionPairs: any;
}

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
      />
    );
  }

  if (["list", "set", "tuple"].includes(kind)) {
    return (
      <CollectionContent
        mode="single"
        items={collectionItems}
        setItems={setCollectionItems}
      />
    );
  }

  if (kind === "dict") {
    return (
      <CollectionContent
        mode="pair"
        items={collectionPairs}
        setItems={setCollectionPairs}
      />
    );
  }

  return null;
};

export default Content;
