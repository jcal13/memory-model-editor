import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import FunctionNameSelectorPanel from "./FunctionNameSelectorPanel";
import {
  useListSync,
  useSingleFunctionPanelRegistry,
  useFunctionPanelRef,
} from "../hooks/useEditor";
import styles from "./FunctionEditor.module.css";

// Sentinel value meaning "not set"
export const NO_FUNCTION_NAME = "NoFunction";

interface Props {
  names: string[];
  onSelect: (name: string) => void;
  onAdd?: (name: string) => void;
  onRemove?: (name: string) => void;
  currentName: string;
  buttonClassName?: string;
  editable: boolean;
  sandbox: boolean;
}

export default function FunctionNameSelector({
  names,
  onSelect,
  onAdd,
  onRemove,
  currentName,
  buttonClassName = "",
  editable,
  sandbox,
}: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<string[]>(names);
  useListSync(names, setList);

  const panelRef = useFunctionPanelRef();
  const closeSelf = useCallback(() => setOpen(false), []);
  useSingleFunctionPanelRegistry(open, closeSelf);

  const displayName = currentName || NO_FUNCTION_NAME;

  if (!editable) {
    return (
      <div>
        <div className={buttonClassName}>{displayName}</div>
      </div>
    );
  }

  const toggleOpen = () => setOpen((v) => !v);

  const handleAdd = (name: string) => {
    if (!list.includes(name)) {
      setList((prev) => [...prev, name]);
      onAdd?.(name);
    }
  };

  const handleRemove = (name: string) => {
    setList((prev) => prev.filter((v) => v !== name));
    onRemove?.(name);
  };

  const handleSelect = (name: string) => {
    onSelect(name);
    closeSelf();
  };

  const handleUnassign = () => {
    onSelect(NO_FUNCTION_NAME);
    closeSelf();
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
        className={`${buttonClassName} ${open ? styles.activeOutline : ""}`.trim()}
      >
        {displayName}
      </button>

      {open &&
        ReactDOM.createPortal(
          <Draggable
            nodeRef={panelRef as unknown as React.RefObject<HTMLElement>}
            defaultPosition={{ x: 150, y: 150 }}
            onStart={(e) => {
              e.stopPropagation();
              document.body.style.userSelect = "none";
              document.body.style.webkitUserSelect = "none";
            }}
            onStop={() => {
              document.body.style.userSelect = "";
              document.body.style.webkitUserSelect = "";
            }}
          >
            <div
              ref={panelRef}
              className={styles.panelContainer}
              data-editor-ignore
            >
              <FunctionNameSelectorPanel
                names={list}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onSelect={handleSelect}
                onClose={closeSelf}
                onUnassign={handleUnassign}
                sandbox={sandbox}
              />
            </div>
          </Draggable>,
          document.body
        )}
    </div>
  );
}
