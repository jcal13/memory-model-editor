import styles from "../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../shared/types";

/**
 * Props for the RemoveButton component.
 */
interface Props {
  element: {
    id: ID;
    kind: {
      name: string; // Type of the box (e.g., "primitive", "function", "list", "class", etc.)
      type?: string; // Optional subtype for collections
    };
  };
  onSave: (id: ID, boxType: any) => void;
  onRemove: () => void;
  dataType: string;
  value: string;
  hoverRemove: boolean;
  setHoverRemove: React.Dispatch<React.SetStateAction<boolean>>;
  functionName?: string;
  functionParams?: any[];
  className?: string; // ➕ Added for class type
  ownClassVariables?: any[]; // ➕ Added for class type
  items: any;
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
  className,
  ownClassVariables = [],
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
      : kind === "class"
      ? {
          name: kind,
          type: "class",
          value: ownClassVariables,
          className, // ➕ include class name
        }
      : {
          name: kind,
          type: element.kind.type,
          value: items,
        };

  // Trigger save and remove actions
  const handleClick = () => {
    onSave(element.id, saveParams);
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

