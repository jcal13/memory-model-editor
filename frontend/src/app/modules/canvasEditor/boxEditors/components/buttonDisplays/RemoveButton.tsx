import styles from "../../styles/BoxEditorStyles.module.css";

/**
 * Props for the RemoveButton component.
 */
interface Props {
  element: {
    id: string;
    kind: {
      name: string; // Type of the box (e.g., "primitive", "function", "list", etc.)
      type?: string; // Optional subtype for collections
    };
  };
  onSave: (params: any) => void; // Function to call with updated box data before removing
  onRemove: () => void; // Function to call when removing the box
  dataType: string; // Selected data type (for primitives)
  value: string; // Value of the primitive
  hoverRemove: boolean; // Whether the remove button is currently hovered
  setHoverRemove: React.Dispatch<React.SetStateAction<boolean>>; // Hover state setter
  functionName?: string; // Function name (if applicable)
  functionParams?: any[]; // Parameters for the function (if applicable)
  items: any; // Collection or structured value (e.g., list, dict)
}

/**
 * A button component used in the Box Editor UI that:
 * - Saves the current box state
 * - Removes the box from the canvas
 */
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

  // Determine save payload based on the box type
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

  // Trigger save and remove actions
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
