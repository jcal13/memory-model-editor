import React, { useMemo } from "react";
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
  sandbox
}) => {
  const nextId = useMemo<number>(() => {
    const nums = ids.filter((v): v is number => typeof v === "number");
    return nums.length ? Math.max(...nums) + 1 : 1;
  }, [ids]);

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
              {/* only show remove if sandbox=true */}
              {sandbox === true && (
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
        {/* only show add when sandbox=true */}
        {sandbox === true && (
          <button
            type="button"
            onClick={() => onAdd(nextId)}
            className={boxStyles.addButton}
          >
            Add ID
          </button>
        )}
      </div>

      {/* only show empty message when sandbox=true and no ids */}
      {sandbox === true && ids.length === 0 && (
        <div className={panelStyles.empty}>
          No IDs yet — click “Add ID” to create one.
        </div>
      )}
    </div>
  );
};

export default IdSelectorPanel;
