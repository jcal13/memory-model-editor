import styles from "../../Editor.module.css";
import type { Dispatch, SetStateAction } from "react";
import IdSelector from "../../idEditor/IdEditor";
import {
  BoxType,
  CanvasElement,
  ID,
  ElementError,
  VisualStyle,
} from "../../../shared/types";
import { isIdInvalid, getErrorsForId } from "../../utils/validationHelpers";
import FieldValidationTooltip from "../FieldValidationTooltip";
import InlineTargetEditor from "../InlineTargetEditor";

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
  validationErrors?: ElementError[]; // Validation errors for highlighting
  elements?: any[]; // All canvas elements for ID usage tracking
  ownerElement: CanvasElement;
  visualStyle?: VisualStyle;
  onCommitKind?: (kind: BoxType) => void;
  onElementsChange?: Dispatch<SetStateAction<CanvasElement[]>>;
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
  elements = [],
  ownerElement,
  visualStyle = "memoryviz",
  onCommitKind,
  onElementsChange,
}: Props) => {
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const commitSingles = (nextItems: ID[]) => {
    onCommitKind?.({
      name: ownerElement.kind.name,
      type: ownerElement.kind.type,
      value: nextItems,
    } as BoxType);
  };

  const commitPairs = (nextPairs: Array<[ID | string, ID]>) => {
    onCommitKind?.({
      name: "dict",
      type: "dict",
      value: Object.fromEntries(nextPairs) as Record<number, number | null>,
    });
  };

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
              {visualStyle === "pythonTutor" ? (
                <InlineTargetEditor
                  ownerElement={ownerElement}
                  currentTarget={itemId}
                  onTargetChange={(picked) => {
                    const nextItems = items.map((value, itemIndex) =>
                      itemIndex === idx ? (picked as ID) : value
                    );
                    setItems(nextItems);
                    commitSingles(nextItems);
                  }}
                  addId={addId}
                  elements={elements}
                  onElementsChange={onElementsChange}
                  validationErrors={fieldErrors}
                />
              ) : (
                <FieldValidationTooltip errors={fieldErrors}>
                  <IdSelector
                    currentId={itemId}
                    ids={ids}
                    onAdd={addId}
                    onSelect={(picked) => {
                      const nextItems = items.map((value, itemIndex) =>
                        itemIndex === idx ? picked : value
                      );
                      setItems(nextItems);
                    }}
                    onRemove={removeId}
                    buttonClassName={`${styles.collectionIdBox} ${
                      hasError ? styles.errorId : ""
                    }`}
                    editable={true}
                    sandbox={sandbox}
                    elements={elements}
                  />
                </FieldValidationTooltip>
              )}
              <button
                className={styles.collectionDeleteButton}
                onClick={() => removeItem(idx)}
                title="Delete item"
                aria-label="Delete item"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // PAIRS (dict)
  return (
    <div className={styles.collectionPairsContainer}>
      {items.map(([keyId, valId]: [ID | string, ID], idx: number) => {
        const keyHasError = isIdInvalid(validationErrors, keyId);
        const valHasError = isIdInvalid(validationErrors, valId);
        const keyErrors = getErrorsForId(validationErrors, keyId);
        const valErrors = getErrorsForId(validationErrors, valId);
        const legacyKeyId =
          typeof keyId === "number" || keyId === "_" ? keyId : "_";
        return (
          <div key={idx} className={styles.collectionPairContainer}>
            {/* KEY ID */}
            <div className={styles.idSelectButtonWrapper}>
              {visualStyle === "pythonTutor" ? (
                <InlineTargetEditor
                  ownerElement={ownerElement}
                  currentTarget={keyId}
                  blankValue={" ".repeat(idx + 1)}
                  onTargetChange={(picked) => {
                    const nextPairs = items.map((pair, pairIndex) =>
                      pairIndex === idx ? [picked as ID | string, pair[1]] : pair
                    );
                    setItems(nextPairs);
                    commitPairs(nextPairs);
                  }}
                  addId={addId}
                  elements={elements}
                  onElementsChange={onElementsChange}
                  validationErrors={keyErrors}
                />
              ) : (
                <FieldValidationTooltip errors={keyErrors}>
                  <IdSelector
                    currentId={legacyKeyId}
                    ids={ids}
                    onAdd={addId}
                    onSelect={(picked) =>
                      setItems((prev) =>
                        prev.map((p, i) => (i === idx ? [picked, p[1]] : p))
                      )
                    }
                    onRemove={removeId}
                    buttonClassName={`${styles.collectionIdBox} ${
                      keyHasError ? styles.errorId : ""
                    }`}
                    editable={true}
                    sandbox={sandbox}
                    elements={elements}
                  />
                </FieldValidationTooltip>
              )}
            </div>

            <div className={styles.collectionPairSeparator}>:</div>

            {/* VALUE ID + REMOVE */}
            <div className={styles.idSelectButtonWrapper}>
              {visualStyle === "pythonTutor" ? (
                <InlineTargetEditor
                  ownerElement={ownerElement}
                  currentTarget={valId}
                  onTargetChange={(picked) => {
                    const nextPairs = items.map((pair, pairIndex) =>
                      pairIndex === idx ? [pair[0], picked as ID] : pair
                    );
                    setItems(nextPairs);
                    commitPairs(nextPairs);
                  }}
                  addId={addId}
                  elements={elements}
                  onElementsChange={onElementsChange}
                  validationErrors={valErrors}
                />
              ) : (
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
                    onRemove={removeId}
                    buttonClassName={`${styles.collectionIdBox} ${
                      valHasError ? styles.errorId : ""
                    }`}
                    editable={true}
                    sandbox={sandbox}
                    elements={elements}
                  />
                </FieldValidationTooltip>
              )}
              <button
                className={styles.collectionDeleteButton}
                onClick={() => removeItem(idx)}
                title="Delete pair"
                aria-label="Delete pair"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollectionItem;
