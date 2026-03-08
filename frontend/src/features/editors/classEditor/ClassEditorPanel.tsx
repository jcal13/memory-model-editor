import React, { useState } from "react";
import panelStyles from "./ClassEditor.module.css";
import boxStyles from "../Editor.module.css";

interface Props {
  classes: string[];
  onAdd: (className: string) => void;
  onSelect: (className: string) => void;
  onRemove: (className: string) => void;
  onClose: () => void;
  sandbox: boolean;
  canManageClasses?: boolean;
}

const ClassSelectorPanel: React.FC<Props> = ({
  classes,
  onAdd,
  onSelect,
  onRemove,
  onClose,
  sandbox,
  canManageClasses = sandbox,
}) => {
  const [customClass, setCustomClass] = useState("");
  const [showWarn, setShowWarn] = useState(false);
  const [showDup, setShowDup] = useState(false);

  const handleAdd = () => {
    const trimmed = customClass.trim();
    if (trimmed !== "") {
      if (classes.includes(trimmed)) {
        setShowDup(true);
        setShowWarn(false);
        return;
      }
      onAdd(trimmed);
      setCustomClass("");
      setShowWarn(false);
      setShowDup(false);
      return;
    }
    setShowWarn(true);
    setShowDup(false);
  };

  return (
    <div
      className={`${boxStyles.boxEditorModule} ${panelStyles.panelShell} ${panelStyles.activeOutline}`}
    >
      <div className={`drag-handle ${panelStyles.header}`}>
        <span>Select Class</span>
        <button className={boxStyles.removeItem} onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div className={panelStyles.content}>
        <div className={boxStyles.collectionIdContainer}>
          {classes.map((className) => (
            <div key={className} className={boxStyles.collectionIdBox}>
              <button
                type="button"
                className={boxStyles.collectionIdNoBorder}
                onClick={() => onSelect(className)}
              >
                {className}
              </button>
              {canManageClasses && (
                <button
                  type="button"
                  className={boxStyles.collectionRemoveId}
                  onClick={() => onRemove(className)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {canManageClasses && classes.length === 0 && (
          <div className={panelStyles.empty}>
            No classes yet — enter a name and click "Add".
          </div>
        )}

        <div className={panelStyles.panelControlsDiv}>
          {canManageClasses && (
            <>
              <input
                type="text"
                value={customClass}
                onChange={(e) => {
                  setCustomClass(e.target.value);
                  setShowWarn(false);
                  setShowDup(false);
                }}
                placeholder="Enter new class name"
                className={panelStyles.classInputBox}
                aria-label="New class name"
              />
              <button
                type="button"
                onClick={handleAdd}
                className={boxStyles.addButton}
              >
                Add
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onSelect("NoClass")}
            className={boxStyles.removeButton}
          >
            Unassign
          </button>
        </div>

        {showWarn && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Please enter a class name
          </span>
        )}
        {showDup && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Class already added
          </span>
        )}
      </div>
    </div>
  );
};

export default ClassSelectorPanel;
