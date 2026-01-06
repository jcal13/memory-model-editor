import styles from "../../Editor.module.css";
import { ID, ValidationError } from "../../../shared/types";
import IdSelector from "../../idEditor/IdEditor";
import { isIdInvalid, getErrorsForId } from "../../utils/validationHelpers";
import FieldValidationTooltip from "../FieldValidationTooltip";

/**
 * Props for the ClassContent component.
 */
interface Props {
  classVariables: any; // Array of variable objects for the class
  setVariables: any; // Setter to update the list of variables
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
  validationErrors?: ValidationError[]; // Validation errors for highlighting
}

/**
 * ClassContent renders editable fields for class variables (attributes).
 *
 * Each variable consists of:
 * - A `name` input box for attribute name
 * - A visual placeholder for the variable's target ID
 * - A remove button to delete the variable
 *
 * The component also provides an "Add Variable" button to append a new attribute.
 */
const ClassContent = ({
  classVariables,
  setVariables,
  ids,
  addId,
  removeId,
  sandbox,
  validationErrors,
}: Props) => {
  // Add a new empty variable to the list
  const addVariable = () =>
    setVariables([...classVariables, { name: "", targetId: "_" }]);

  // Remove a variable at a given index
  const removeVariable = (i: number) =>
    setVariables(classVariables.filter((_: any, idx: any) => idx !== i));

  // Update the name of a variable at a given index
  const changeName = (i: number, val: string) =>
    setVariables(
      classVariables.map((v: any, idx: any) =>
        idx === i ? { ...v, name: val } : v
      )
    );

  // Update the targetId of a variable at a given index
  const setTargetId = (i: number, id: ID) =>
    setVariables(
      classVariables.map((v: any, idx: any) =>
        idx === i ? { ...v, targetId: id } : v
      )
    );

  return (
    <div className={styles.contentContainer}>
      {classVariables.length > 0 && (
        <div className={styles.ItemContainer}>
          {classVariables.map((v: any, idx: any) => {
            const hasError = isIdInvalid(validationErrors, v.targetId);
            const fieldErrors = getErrorsForId(validationErrors, v.targetId);
            return (
              <div key={idx} className={styles.pairItem}>
                <input
                  placeholder="variable"
                  value={v.name}
                  onChange={(e) => changeName(idx, e.target.value)}
                  className={styles.variableNameBox}
                />
                <div className={styles.idSelectButtonWrapper}>
                  <FieldValidationTooltip errors={fieldErrors}>
                    <IdSelector
                      currentId={v.targetId}
                      ids={ids}
                      onAdd={addId}
                      onSelect={(id) => setTargetId(idx, id)}
                      onRemove={removeId}
                      buttonClassName={`${styles.collectionIdBox} ${
                        hasError ? styles.errorId : ""
                      }`}
                      sandbox={sandbox}
                      editable={true}
                    />
                  </FieldValidationTooltip>
                </div>
                <button
                  onClick={() => removeVariable(idx)}
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
        <button className={styles.addButton} onClick={addVariable}>
          Add Variable
        </button>
      </div>
    </div>
  );
};

export default ClassContent;
