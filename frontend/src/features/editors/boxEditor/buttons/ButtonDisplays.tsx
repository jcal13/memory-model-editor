import React from "react";
import styles from "./ButtonDisplays.module.css";
import { ID } from "../../../shared/types";

/**
 * Props for the ButtonDisplays component.
 */
interface Props {
  element: {
    id: ID;
    kind: {
      name: string; // Type of the box (e.g., "primitive", "function", "list", "class", etc.)
      type?: string; // Optional subtype for collections
    };
    invalidated?: boolean; // Optional flag to track invalidation state
  };
  onSave: (id: ID, boxType: any, invalidated: boolean) => void;
  onToggleInvalidate: () => void;
  invalidated: boolean;
  onRemove: () => void;
  dataType: string;
  value: string;
  hoverRemove: boolean;
  setHoverRemove: React.Dispatch<React.SetStateAction<boolean>>;
  functionName?: string;
  functionParams?: any[];
  className?: string;
  ownClassVariables?: any[];
  items: any;
  disableRemove?: boolean;
  disableInvalidate?: boolean;
}

/**
 * A button component used in the Box Editor UI that:
 * - Saves the current box state
 * - Removes the box from the canvas
 * - Invalidates / uninvalidates the canvas element
 */
const ButtonDisplays = ({
  element,
  onSave,
  onToggleInvalidate,
  invalidated,
  onRemove,
  dataType,
  value,
  setHoverRemove,
  functionName,
  functionParams,
  className,
  ownClassVariables = [],
  items,
  disableRemove = false,
  disableInvalidate = false,
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

  // Save and remove actions
  const handleClick = () => {
    if (disableRemove) {
      return;
    }
    onSave(element.id, saveParams, invalidated);
    onRemove();
  };

  // Invalidate / uninvalidate actions
  const handleInvalidate = () => {
    if (disableInvalidate) {
      return;
    }
    onToggleInvalidate();
  };

  return (
    <>
      {!disableInvalidate && (
      <div className={styles.invalidateGroup}>
        <button
          onClick={handleInvalidate}
          className={styles.invalidateButton}
        >
          {invalidated ? "Validate" : "Invalidate"}
        </button>
        <span className={styles.helpIcon} aria-label="Invalidate help">
          ?
          <span className={styles.tooltip}>
            Marks this box as invalidated, indicating it is no longer active.
            A common use case is denoting a stack frame that has been popped off the call stack.
          </span>
        </span>
      </div>
      )}
      {!disableRemove && (
        <button
          onMouseEnter={() => setHoverRemove(true)}
          onMouseLeave={() => setHoverRemove(false)}
          onClick={handleClick}
          className={styles.removeButton}
        >
          Remove Box
        </button>
      )}
    </>
  );
};

export default ButtonDisplays;
