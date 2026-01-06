import styles from "../../Editor.module.css";
import IdSelector from "../../idEditor/IdEditor";
import { ID, ValidationError } from "../../../shared/types";
import { isIdInvalid, getErrorsForId } from "../../utils/validationHelpers";
import FieldValidationTooltip from "../FieldValidationTooltip";

/**
 * Props for the CollectionItem component.
 */
interface Props {
  mode: "single" | "pair";
  items: any[]; // list / set / tuple OR dict pairs
  setItems: React.Dispatch<React.SetStateAction<any[]>>; // updates collectionItems in BoxEditorModule
  ids: any; // global ID pool
  addId: (id: ID) => void; // adds a new ID to the pool
  removeId: (id: ID) => void;
  sandbox: boolean;
  validationErrors?: ValidationError[]; // Validation errors for highlighting
}

/**
 * Renders the entire collection (not a single slot) so the caller
 * only has to supply `items` and `setItems`.
 */
const CollectionItem = ({
  mode,
  items,
  setItems,
  ids,
  addId,
  removeId,
  sandbox,
  validationErrors,
}: Props) => {
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  if (items.length === 0) return null;

  // SINGLE ELEMENTS (list / set / tuple)
  if (mode === "single") {
    return (
      <div className={styles.collectionIdContainer}>
        {items.map((itemId: ID, idx: number) => {
          const hasError = isIdInvalid(validationErrors, itemId);
          const fieldErrors = getErrorsForId(validationErrors, itemId);
          return (
            <div key={idx} className={styles.idSelectButtonWrapper}>
              <FieldValidationTooltip errors={fieldErrors}>
                <IdSelector
                  currentId={itemId}
                  ids={ids}
                  onAdd={addId}
                  onSelect={(picked) =>
                    setItems((prev) =>
                      prev.map((v, i) => (i === idx ? picked : v))
                    )
                  }
                  onRemove={removeId}
                  buttonClassName={`${styles.collectionIdBox} ${
                    hasError ? styles.errorId : ""
                  }`}
                  editable={true}
                  sandbox={sandbox}
                />
              </FieldValidationTooltip>
              <button
                className={styles.deleteVariableButton}
                onClick={() => removeItem(idx)}
                title="Delete item"
                aria-label="Delete item"
              />
            </div>
          );
        })}
      </div>
    );
  }

  // PAIRS (dict)
  return (
    <div className={styles.collectionPairsContainer}>
      {items.map(([keyId, valId]: [ID, ID], idx: number) => {
        const keyHasError = isIdInvalid(validationErrors, keyId);
        const valHasError = isIdInvalid(validationErrors, valId);
        const keyErrors = getErrorsForId(validationErrors, keyId);
        const valErrors = getErrorsForId(validationErrors, valId);
        return (
          <div key={idx} className={styles.collectionPairContainer}>
            {/* KEY ID */}
            <div className={styles.idSelectButtonWrapper}>
              <FieldValidationTooltip errors={keyErrors}>
                <IdSelector
                  currentId={keyId}
                  ids={ids}
                  onAdd={addId}
                  onSelect={(picked) =>
                    setItems((prev) =>
                      prev.map((p, i) => (i === idx ? [picked, p[1]] : p))
                    )
                  }
                  buttonClassName={`${styles.collectionIdBox} ${
                    keyHasError ? styles.errorId : ""
                  }`}
                  editable={true}
                  sandbox={sandbox}
                />
              </FieldValidationTooltip>
            </div>

            <div className={styles.collectionPairSeparator}>:</div>

            {/* VALUE ID + REMOVE */}
            <div className={styles.idSelectButtonWrapper}>
              <FieldValidationTooltip errors={valErrors}>
                <IdSelector
                  currentId={valId}
                  ids={ids}
                  onAdd={addId}
                  onSelect={(picked) =>
                    setItems((prev) =>
                      prev.map((p, i) => (i === idx ? [p[0], picked] : p))
                    )
                  }
                  buttonClassName={`${styles.collectionIdBox} ${
                    valHasError ? styles.errorId : ""
                  }`}
                  editable={true}
                  sandbox={sandbox}
                />
              </FieldValidationTooltip>
              <button
                className={styles.deleteVariableButton}
                onClick={() => removeItem(idx)}
                title="Delete pair"
                aria-label="Delete pair"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollectionItem;
