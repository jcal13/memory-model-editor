import CollectionItem from "./components/CollectionItem";
import CollectionAddButton from "./components/CollectionAddButton";

interface Props {
  mode: "single" | "pair";
  items: any;
  setItems: any;
}

const CollectionContent = ({ mode, items, setItems }: Props) => {
  return (
    <div>
      <CollectionItem mode={mode} items={items} setItems={setItems} />
      <CollectionAddButton mode={mode} items={items} setItems={setItems} />
    </div>
  );
};

export default CollectionContent;
