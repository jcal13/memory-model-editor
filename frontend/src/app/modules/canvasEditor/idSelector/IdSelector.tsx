import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import IdSelectorPanel from "./components/IdSelectorPanel";
import {
  useIdListSync,
  useSinglePanelRegistry,
} from "./hooks/useEffect";
import { usePanelRef } from "./hooks/useRef";
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
  sandbox: boolean;
}

export default function IdSelector({
  ids,
  onSelect,
  onAdd,
  onRemove,
  currentId,
  buttonClassName = "",
  editable,
  sandbox,
}: Props) {
  const [open, setOpen]   = useState(false);
  const [list, setList]   = useState<ID[]>(ids);
  useIdListSync(ids, setList);

  const panelRef  = usePanelRef();
  const closeSelf = useCallback(() => setOpen(false), []);

  if (!editable) {
    return (
      <div data-testid="id-selector-panel">
        <div className={buttonClassName}>
          {currentId != null ? `ID ${currentId}` : "ID _"}
        </div>
      </div>
    );
  }

  useSinglePanelRegistry(open, closeSelf);

  const toggleOpen  = () => setOpen((v) => !v);
  const handleAdd   = (id: ID) => {
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
    closeSelf();
  };

  return (
    <div data-testid="id-selector-panel">
      <button
        type="button"
        onClick={toggleOpen}
        className={buttonClassName}
      >
        {currentId != null ? `ID ${currentId}` : "ID _"}
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
                sandbox={sandbox}
              />
            </div>
          </Draggable>,
          document.body
        )}
    </div>
  );
}
