import React, { useState } from "react";
import panelStyles from "./FunctionEditor.module.css";
import boxStyles from "../Editor.module.css";

interface Props {
  names: string[];
  onAdd: (name: string) => void;
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
  onClose: () => void;
  onUnassign: () => void;
  sandbox: boolean;
  canManageFunctions?: boolean;
}

const FunctionNameSelectorPanel: React.FC<Props> = ({
  names,
  onAdd,
  onSelect,
  onRemove,
  onClose,
  onUnassign,
  sandbox,
  canManageFunctions = sandbox,
}) => {
  const [customName, setCustomName] = useState("");
  const [showWarn, setShowWarn] = useState(false);
  const [showDup, setShowDup] = useState(false);

  const handleAdd = () => {
    const trimmed = customName.trim();
    if (trimmed !== "") {
      if (names.includes(trimmed)) {
        setShowDup(true);
        setShowWarn(false);
        return;
      }
      onAdd(trimmed);
      setCustomName("");
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
        <span>Function Name</span>
        <button className={boxStyles.removeItem} onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div className={panelStyles.content}>
        <div className={boxStyles.collectionIdContainer}>
          {names.map((name) => (
            <div key={name} className={boxStyles.collectionIdBox}>
              <button
                type="button"
                className={boxStyles.collectionIdNoBorder}
                onClick={() => onSelect(name)}
              >
                {name}
              </button>
              {canManageFunctions && (
                <button
                  type="button"
                  className={boxStyles.collectionRemoveId}
                  onClick={() => onRemove(name)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {names.length === 0 && (
          <div className={panelStyles.empty}>
            No function names yet — enter one below and click "Add".
          </div>
        )}

        <div className={panelStyles.panelControlsDiv}>
          {canManageFunctions && (
            <>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setShowWarn(false);
                  setShowDup(false);
                }}
                placeholder="Enter function name"
                className={panelStyles.nameInputBox}
                aria-label="Function name"
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
            onClick={onUnassign}
            className={boxStyles.removeButton}
          >
            Unassign
          </button>
        </div>

        {showWarn && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Please enter a function name
          </span>
        )}
        {showDup && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Name already added
          </span>
        )}
      </div>
    </div>
  );
};

export default FunctionNameSelectorPanel;
