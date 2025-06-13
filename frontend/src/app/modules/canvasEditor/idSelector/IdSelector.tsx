import React, { useState } from "react";
import Draggable from "react-draggable";
import IdSelectorPanel from "./components/IdSelectorPanel";
import { usePanelRefs } from "./hooks/usePanelRefs";
import { useIdListSync } from "./hooks/useIdListSync";
import styles from "./styles/IdSelector.module.css";
import { ID } from "../shared/types";

interface Props {
  ids: ID[];
  onSelect: (id: ID) => void;
  onAdd?: (id: ID) => void;
  onRemove?: (id: ID) => void;
  label?: string;
  currentId: ID;
  buttonClassName?: string;
}

export default function IdSelector({
  ids,
  onSelect,
  onAdd,
  onRemove,
  currentId,
  buttonClassName = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ID[]>(ids);
  useIdListSync(ids, setList);
  const { dragRef } = usePanelRefs();

  const handleAdd = (id: ID) => {
    if (list.includes(id)) return;
    setList((prev) => [...prev, id]);
    onAdd?.(id);
  };

  const handleRemove = (id: ID) => {
    setList((prev) => prev.filter((v) => v !== id));
    onRemove?.(id);
  };

  const handleSelect = (id: ID) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${buttonClassName}`}
      >
        {currentId ? "ID " + currentId : "ID _"}
      </button>

      {open && (
        <Draggable
          nodeRef={dragRef as React.RefObject<HTMLElement>}
          handle=".drag-handle"
          defaultPosition={{ x: 150, y: 150 }}
        >
          <div ref={dragRef} className={styles.panelContainer}>
            <IdSelectorPanel
              ids={list}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onSelect={handleSelect}
            />
          </div>
        </Draggable>
      )}
    </>
  );
}
