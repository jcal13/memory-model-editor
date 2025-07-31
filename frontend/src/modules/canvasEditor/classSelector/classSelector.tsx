import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import ClassSelectorPanel from "./components/ClassSelectorPanel";
import {
  useClassListSync,
  useSingleClassPanelRegistry,
} from "./hooks/useEffect";
import { useClassPanelRef } from "./hooks/useRef";
import styles from "./styles/ClassSelector.module.css";
import { ClassID } from "../shared/types"; 

interface Props {
  classes: ClassID[];
  onSelect: (classId: ClassID) => void;
  onAdd?: (classId: ClassID) => void;
  onRemove?: (classId: ClassID) => void;
  currentClass: ClassID;
  buttonClassName?: string;
  editable: boolean;
  sandbox: boolean;
}

export default function ClassSelector({
  classes,
  onSelect,
  onAdd,
  onRemove,
  currentClass,
  buttonClassName = "",
  editable,
  sandbox,
}: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ClassID[]>(classes);
  useClassListSync(classes, setList);

  const panelRef = useClassPanelRef();
  const closeSelf = useCallback(() => setOpen(false), []);

  useSingleClassPanelRegistry(open, closeSelf);

  if (!editable) {
    return (
      <div data-testid="class-selector-panel">
        <div className={buttonClassName}>
          {currentClass != null ? ` ${currentClass}` : "Class _"}
        </div>
      </div>
    );
  }

  const toggleOpen = () => setOpen((v) => !v);
  const handleAdd = (classId: ClassID) => {
    if (!list.includes(classId)) {
      setList((prev) => [...prev, classId]);
      onAdd?.(classId);
    }
  };
  const handleRemove = (classId: ClassID) => {
    setList((prev) => prev.filter((v) => v !== classId));
    onRemove?.(classId);
  };
  const handleSelect = (classId: ClassID) => {
    onSelect(classId);
    closeSelf();
  };

  return (
    <div data-testid="class-selector-panel">
      <button
        type="button"
        onClick={toggleOpen}
        className={`${buttonClassName} ${open ? styles.activeOutline : ""}`.trim()}
      >
        {currentClass != "" ? `${currentClass}` : "Class _"}
      </button>

      {open &&
        ReactDOM.createPortal(
          <Draggable
            nodeRef={panelRef as unknown as React.RefObject<HTMLElement>}
            defaultPosition={{ x: 150, y: 150 }}
            onStart={(e) => e.stopPropagation()}
          >
            <div
              ref={panelRef}
              className={styles.panelContainer}
              data-editor-ignore
            >
        <ClassSelectorPanel
          classes={list}
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
