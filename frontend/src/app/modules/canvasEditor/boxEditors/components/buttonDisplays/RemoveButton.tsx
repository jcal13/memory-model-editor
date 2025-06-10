import { PrimitiveKind } from "../../../shared/types";

interface Props {
  element: any;
  onSave: (kind: PrimitiveKind) => void;
  onRemove: () => void;
  dataType: any;
  value: string;
  hoverRemove: boolean;
  setHoverRemove: React.Dispatch<React.SetStateAction<boolean>>;
}

const RemoveButton = ({
  element,
  onSave,
  onRemove,
  dataType,
  value,
  hoverRemove,
  setHoverRemove,
}: Props) => {
  const handleSave = () => {
    onSave({ name: element.kind.name, type: dataType, value });
  };

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "flex-end" }}>
      <button
        onMouseEnter={() => setHoverRemove(true)}
        onMouseLeave={() => setHoverRemove(false)}
        onClick={() => {
          handleSave();
          onRemove();
        }}
        style={{
          background: hoverRemove ? "#d32f2f" : "#f44336",
          color: "#fff",
          border: "none",
          padding: "4px 6px",
          fontSize: "0.8rem",
          borderRadius: 4,
          cursor: "pointer",
          transition: "background-color 0.25s ease",
        }}
      >
        Remove Box
      </button>
    </div>
  );
};

export default RemoveButton;
