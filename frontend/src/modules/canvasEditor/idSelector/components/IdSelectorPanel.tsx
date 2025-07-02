import React, { useMemo, useState } from "react";
import panelStyles from "../styles/IdSelector.module.css";
import boxStyles from "../../boxEditors/styles/BoxEditorStyles.module.css";
import { ID } from "../../shared/types";

interface Props {
  ids: ID[];
  onAdd: (id: ID) => void;
  onSelect: (id: ID) => void;
  onRemove: (id: ID) => void;
  sandbox: boolean;
}

const IdSelectorPanel: React.FC<Props> = ({
  ids,
  onAdd,
  onSelect,
  onRemove,
  sandbox,
}) => {
  const nextId = useMemo<number>(() => {
    const nums = ids.filter((v): v is number => typeof v === "number");
    let i = 1;
    while (nums.includes(i)) i += 1;
    return i;
  }, [ids]);

  const [customId, setCustomId] = useState("");
  const [showWarn, setShowWarn] = useState(false);
  const [showDup, setShowDup] = useState(false);

  const handleAdd = () => {
    if (customId.trim() !== "") {
      const n = Number(customId);
      if (Number.isInteger(n)) {
        if (ids.includes(n as ID)) {
          setShowDup(true);
          setShowWarn(false);
          return;
        }
        onAdd(n as ID);
        setCustomId("");
        setShowWarn(false);
        setShowDup(false);
        return;
      }
      setShowWarn(true);
      setShowDup(false);
      return;
    }
    onAdd(nextId);
    setShowWarn(false);
    setShowDup(false);
  };

  return (
    <div className={`${boxStyles.boxEditorModule} ${panelStyles.panelShell}`}>
      <div className={`drag-handle ${panelStyles.header}`}>Select ID</div>

      <div className={panelStyles.content}>
        <div className={boxStyles.collectionIdContainer}>
          {ids.map((id) => (
            <div key={id.toString()} className={boxStyles.collectionIdBox}>
              <button
                type="button"
                className={boxStyles.collectionIdNoBorder}
                onClick={() => onSelect(id)}
              >
                {id}
              </button>
              {sandbox && (
                <button
                  type="button"
                  className={boxStyles.collectionRemoveId}
                  onClick={() => onRemove(id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {sandbox && ids.length === 0 && (
          <div className={panelStyles.empty}>
            No IDs yet — click “Add ID” to create one.
          </div>
        )}

        <div className={panelStyles.panelControlsDiv}>
          {sandbox && (
            <>
              <input
                type="text"
                value={customId}
                onChange={(e) => {
                  setCustomId(e.target.value);
                  setShowWarn(false);
                  setShowDup(false);
                }}
                placeholder="Enter custom ID or leave blank"
                className={panelStyles.idInputBox}
              />
              <button
                type="button"
                onClick={handleAdd}
                className={boxStyles.addButton}
              >
                Add ID
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onSelect("_")}
            className={boxStyles.removeButton}
          >
            Unassign
          </button>
        </div>

        {showWarn && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Please enter an integer
          </span>
        )}
        {showDup && (
          <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>
            Already Added
          </span>
        )}
      </div>
    </div>
  );
};

export default IdSelectorPanel;
