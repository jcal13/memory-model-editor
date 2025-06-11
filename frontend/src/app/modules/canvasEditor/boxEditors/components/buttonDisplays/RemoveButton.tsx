import styles from "../../styles/BoxEditorStyles.module.css";

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
    <div className={styles.removeButtonContainer}>
      <button
        onMouseEnter={() => setHoverRemove(true)}
        onMouseLeave={() => setHoverRemove(false)}
        onClick={handleClick}
        className={styles.removeButton}
      >
        Remove Box
      </button>
    </div>
  );
};

export default RemoveButton;
