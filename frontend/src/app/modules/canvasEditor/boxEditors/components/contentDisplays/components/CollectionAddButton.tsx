import { addButton, addPairButton } from "../../../styles/boxEditorStyles";

interface Props {
  mode: "single" | "pair";
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const CollectionAddButton = ({ mode, items, setItems }: Props) => {
  const handleAdd = () => {
    if (mode === "single") {
      setItems([...items, null]);
    } else {
      setItems([...items, ["", null]]);
    }
  };

  const buttonText = mode === "single" ? "+ Add Element" : "+ Add Pair";
  const buttonStyle = mode === "single" ? addButton : addPairButton;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <button onClick={handleAdd} style={buttonStyle}>
        {buttonText}
      </button>
    </div>
  );
};

export default CollectionAddButton;
