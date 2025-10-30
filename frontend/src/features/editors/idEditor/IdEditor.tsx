import React, { useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import IdSelectorPanel from "./IdSelectorPanel";
import { useIdListSync, useSinglePanelRegistry } from "../hooks/useEffect";
import { usePanelRef } from "../hooks/useRef";
import styles from "./IdEditor.module.css";
import { ID } from "../../shared/types";

interface Props {
  ids: ID[];
  onSelect: (id: ID) => void;
  onAdd?: (id: ID) => void;
  onRemove?: (id: ID) => void;
  currentId: ID;
  buttonClassName?: string;
  editable: boolean;
  sandbox: boolean;
  elements?: any[];
}

export default function IdEditor({
  ids,
  onSelect,
  onAdd,
  onRemove,
  currentId,
  buttonClassName = "",
  editable,
  sandbox,
  elements = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ID[]>(ids);
  useIdListSync(ids, setList);

  const panelRef = usePanelRef();
  const closeSelf = useCallback(() => setOpen(false), []);

  useSinglePanelRegistry(open, closeSelf);

  const usedIds = useMemo(() => {
    const used = new Set<ID>();
    elements.forEach((el: any) => {
      if (el.id !== "_" && el.id !== null) {
        used.add(el.id);
      }

      if (Array.isArray(el.kind?.value)) {
        el.kind.value.forEach((id: ID) => {
          if (id !== "_" && id !== null) used.add(id);
        });
      }

      if (
        el.kind?.value &&
        typeof el.kind.value === "object" &&
        !Array.isArray(el.kind.value)
      ) {
        Object.values(el.kind.value).forEach((id: any) => {
          if (id !== "_" && id !== null) used.add(id);
        });
      }

      if (el.kind?.params && Array.isArray(el.kind.params)) {
        el.kind.params.forEach((param: any) => {
          if (
            param.targetId &&
            param.targetId !== "_" &&
            param.targetId !== null
          ) {
            used.add(param.targetId);
          }
        });
      }

      if (el.kind?.classVariables && Array.isArray(el.kind.classVariables)) {
        el.kind.classVariables.forEach((variable: any) => {
          if (
            variable.targetId &&
            variable.targetId !== "_" &&
            variable.targetId !== null
          ) {
            used.add(variable.targetId);
          }
        });
      }
    });
    return used;
  }, [elements]);

  if (!editable) {
    return (
      <div data-testid="id-selector-panel">
        <div className={buttonClassName}>
          {currentId != null ? `ID ${currentId}` : "ID _"}
        </div>
      </div>
    );
  }

  const toggleOpen = () => setOpen((v) => !v);
  const handleAdd = (id: ID) => {
    if (!list.includes(id)) {
      setList((prev) => [...prev, id]);
      onAdd?.(id);
    }
  };
  const handleRemove = (id: ID) => {
    setList((prev) => prev.filter((v) => v !== id));
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
        className={`${buttonClassName} ${
          open ? styles.activeOutline : ""
        }`.trim()}
      >
        {currentId != null ? `ID ${currentId}` : "ID _"}
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
              <IdSelectorPanel
                ids={list}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onSelect={handleSelect}
                sandbox={sandbox}
                onClose={closeSelf}
                usedIds={usedIds}
              />
            </div>
          </Draggable>,
          document.body
        )}
    </div>
  );
}
