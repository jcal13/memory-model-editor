import { PrimitiveKind } from "../../../shared/types";

interface Props {
  element: {
    id: string;
    kind: {
      name: string;
      type?: string;
    };
  };
  onSave: (params: any) => void;
  onRemove: () => void;
  dataType: string;
  value: string;
  hoverRemove: boolean;
  setHoverRemove: React.Dispatch<React.SetStateAction<boolean>>;
  functionName?: string;
  functionParams?: any[];
  items: any;
}

const RemoveButton = ({
  element,
  onSave,
  onRemove,
  dataType,
  value,
  hoverRemove,
  setHoverRemove,
  functionName,
  functionParams,
  items,
}: Props) => {
  const kind = element.kind.name;

  const saveParams =
    kind === "primitive"
      ? { name: kind, type: dataType, value }
      : kind === "function"
      ? {
          name: kind,
          type: "function",
          value: null,
          functionName,
          functionParams,
        }
      : {
          name: kind,
          type: element.kind.type,
          value: items,
        };

  const handleClick = () => {
    onSave(saveParams);
    onRemove();
  };

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "flex-end" }}>
      <button
        onMouseEnter={() => setHoverRemove(true)}
        onMouseLeave={() => setHoverRemove(false)}
        onClick={handleClick}
        style={{
          backgroundColor: hoverRemove ? "#d32f2f" : "#f44336",
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
