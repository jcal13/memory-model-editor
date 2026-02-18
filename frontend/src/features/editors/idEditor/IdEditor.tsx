import React, { useState, useCallback, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import IdSelectorPanel from "./IdSelectorPanel";
import {
  useListSync as useIdListSync,
  useSinglePanelRegistry,
  usePanelRef,
} from "../hooks/useEditor";
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
            param.targetId !== undefined &&
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
            variable.targetId !== undefined &&
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

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  const handleAdd = useCallback((id: ID) => {
    if (!list.includes(id)) {
      setList((prev) => [...prev, id]);
      onAdd?.(id);
    }
  }, [list, onAdd]);

  const handleRemove = useCallback((id: ID) => {
    setList((prev) => prev.filter((v) => v !== id));
    onRemove?.(id);
  }, [onRemove]);

  const handleSelect = useCallback((id: ID) => {
    onSelect(id);
    closeSelf();
  }, [onSelect, closeSelf]);

  // When the trigger button is focused (e.g. via Tab), pressing a digit
  // immediately assigns that ID if it exists — no need to open the panel.
  const handleButtonKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      const typedNumber = Number(e.key);
      if (list.includes(typedNumber as ID)) {
        e.preventDefault();
        onSelect(typedNumber as ID);
      }
    }
  }, [list, onSelect]);

  // Handle keypresses for quick ID selection when panel is open
  useEffect(() => {
    if (!open || !editable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Check if a digit key was pressed (0-9)
      if (e.key >= '0' && e.key <= '9') {
        const typedNumber = Number(e.key);
        // Only select if this ID exists in the list
        if (list.includes(typedNumber as ID)) {
          e.preventDefault();
          handleSelect(typedNumber as ID);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, editable, list, handleSelect]);

  if (!editable) {
    return (
      <div data-testid="id-selector-panel">
        <div className={buttonClassName}>
          {currentId != null ? `ID ${currentId}` : "ID _"}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="id-selector-panel">
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleButtonKeyDown}
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
