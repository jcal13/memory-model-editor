import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import IdSelectorPanel from "./components/IdSelectorPanel";
import { useIdListSync } from "./hooks/useEffect";
import styles from "./styles/IdSelector.module.css";
import { ID } from "../shared/types";

interface Props {
  ids: ID[];
  onSelect: (id: ID) => void;
  onAdd?: (id: ID) => void;
  onRemove?: (id: ID) => void;
  currentId: ID;
  buttonClassName?: string;
  editable: boolean;
}

export default function IdSelector({
  ids,
  onSelect,
  onAdd,
  onRemove,
  currentId,
  buttonClassName = "",
  editable
}: Props) {
  // Non-interactive display when not editable
  if (!editable) {
    return (
      <div data-testid="id-selector-panel">
        <div className={buttonClassName}>
          {currentId ? `ID ${currentId}` : "ID _"}
        </div>
      </div>
    );
  }

  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ID[]>(ids);
  useIdListSync(ids, setList);

  const panelRef = useRef<HTMLDivElement>(null);

  const handleAdd = (id: ID) => {
    if (!list.includes(id)) {
      setList(prev => [...prev, id]);
      onAdd?.(id);
    }
  };

  const handleRemove = (id: ID) => {
    setList(prev => prev.filter(v => v !== id));
    onRemove?.(id);
  };

  const handleSelect = (id: ID) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div data-testid="id-selector-panel">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={buttonClassName}
      >
        {currentId ? `ID ${currentId}` : "ID _"}
      </button>

      {open &&
        ReactDOM.createPortal(
          <Draggable
            nodeRef={panelRef as unknown as React.RefObject<HTMLElement>}
            defaultPosition={{ x: 150, y: 150 }}
            onStart={e => e.stopPropagation()}
          >
            <div
              ref={panelRef}
              className={styles.panelContainer}
              data-editor-ignore
            >
              <IdSelectorPanel
                ids={list}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onSelect={handleSelect}
              />
            </div>
          </Draggable>,
          document.body
        )}
    </div>
  );
}
