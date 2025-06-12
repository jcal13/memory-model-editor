import React, { useState } from "react";
import Draggable from "react-draggable";
import IdSelectorPanel from "./components/IdSelectorPanel";
import { usePanelRefs } from "./hooks/usePanelRefs";
import { useIdListSync } from "./hooks/useIdListSync";
import styles from "./styles/IdSelector.module.css";
import { ID } from "../shared/types";

/* ==================================================
   === ID Selector – Launcher + Draggable Panel   ===
   ==================================================
    ↳ Works with IDs of type **number | "None"**
*/

interface Props {
  ids: ID[];
  onSelect: (id: ID) => void;
  onAdd?: (id: ID) => void;
  label?: string;
}

export default function IdSelector({
  ids,
  onSelect,
  onAdd,
  label = "Select ID",
}: Props) {
  /* ========= Local State & Refs ========= */
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ID[]>(ids);
  useIdListSync(ids, setList);
  const { dragRef } = usePanelRefs();

  /* ========= Handlers ========= */
  const handleAdd = (id: ID) => {
    if (list.includes(id)) return; // duplicate guard
    setList((prev) => [...prev, id]);
    onAdd?.(id);
  };

  const handleSelect = (id: ID) => {
    onSelect(id);
    setOpen(false);
  };

  /* ========= Render ========= */
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={styles.trigger}
      >
        {label}
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
              onSelect={handleSelect}
            />
          </div>
        </Draggable>
      )}
    </>
  );
}
