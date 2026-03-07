import styles from "../../Editor.module.css";
import type { Dispatch, SetStateAction } from "react";
import {
  BoxType,
  CanvasElement,
  ID,
  ElementError,
  VisualStyle,
} from "../../../shared/types";
import IdSelector from "../../idEditor/IdEditor";
import { isIdInvalid, getErrorsForId } from "../../utils/validationHelpers";
import FieldValidationTooltip from "../FieldValidationTooltip";
import InlineTargetEditor from "../InlineTargetEditor";

/**
 * Props for the FunctionContent component.
 */
interface Props {
  functionParams: any; // Array of parameter objects for the function
  setParams: any; // Setter to update the list of parameters
  functionName: string;
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
  validationErrors?: ElementError[]; // Validation errors for highlighting
  elements?: any[]; // All canvas elements for ID usage tracking
  ownerElement: CanvasElement;
  visualStyle?: VisualStyle;
  onCommitKind?: (kind: BoxType) => void;
  onElementsChange?: Dispatch<SetStateAction<CanvasElement[]>>;
}

/**
 * FunctionContent renders the editable parameter fields for a function box.
 */
const FunctionContent = ({
  functionParams,
  setParams,
  functionName,
  ids,
  addId,
  removeId,
  sandbox,
  validationErrors,
  elements = [],
  ownerElement,
  visualStyle = "memoryviz",
  onCommitKind,
  onElementsChange,
}: Props) => {
  // Add a new empty parameter to the list
  const addParam = () =>
    setParams([...functionParams, { name: "", targetId: "_" }]);

  // Remove a parameter at a given index
  const removeParam = (i: number) =>
    setParams(functionParams.filter((_: any, idx: any) => idx !== i));

  // Update the name of a parameter at a given index
  const changeName = (i: number, val: string) =>
    setParams(
      functionParams.map((p: any, idx: any) =>
        idx === i ? { ...p, name: val } : p
      )
    );

  // Update the targetId of a parameter at a given index
  const setTargetId = (i: number, id: ID) =>
    {
      const nextParams = functionParams.map((p: any, idx: any) =>
        idx === i ? { ...p, targetId: id } : p
      );
      setParams(nextParams);
      onCommitKind?.({
        name: "function",
        type: "function",
        value: null,
        functionName,
        params: nextParams,
      });
    };

  return (
    <div className={styles.contentContainer}>
      {functionParams.length > 0 && (
        <div className={styles.ItemContainer}>
          {functionParams.map((p: any, idx: any) => {
            const hasError = isIdInvalid(validationErrors, p.targetId);
            const fieldErrors = getErrorsForId(validationErrors, p.targetId);
            return (
              <div key={idx} className={styles.pairItem}>
                <input
                  placeholder="var"
                  value={p.name}
                  onChange={(e) => changeName(idx, e.target.value)}
                  className={styles.variableNameBox}
                />
                <div className={styles.idSelectButtonWrapper}>
                  {visualStyle === "pythonTutor" ? (
                    <InlineTargetEditor
                      ownerElement={ownerElement}
                      currentTarget={p.targetId}
                      onTargetChange={(id) => setTargetId(idx, id as ID)}
                      addId={addId}
                      elements={elements}
                      onElementsChange={onElementsChange}
                      validationErrors={fieldErrors}
                    />
                  ) : (
                    <FieldValidationTooltip errors={fieldErrors}>
                      <IdSelector
                        currentId={p.targetId}
                        ids={ids}
                        onAdd={addId}
                        onSelect={(id) => setTargetId(idx, id)}
                        onRemove={removeId}
                        buttonClassName={`${styles.collectionIdBox} ${
                          hasError ? styles.errorId : ""
                        }`}
                        sandbox={sandbox}
                        editable={true}
                        elements={elements}
                      />
                    </FieldValidationTooltip>
                  )}
                </div>
                <button
                  onClick={() => removeParam(idx)}
                  className={styles.deleteVariableButton}
                  title="Delete variable"
                  aria-label="Delete variable"
                />
              </div>
            );
          })}
        </div>
      )}
      <div>
        <button className={styles.addButton} onClick={addParam}>
          Add Variable
        </button>
      </div>
    </div>
  );
};

export default FunctionContent;
