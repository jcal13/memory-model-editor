import { CanvasElement, ElementError } from "../../shared/types";
import styles from "./ErrorListDisplay.module.css";

export interface ErrorDisplayItem {
  boxId: number;
  elementId: number | "_";
  elementType: string;
  error: ElementError;
}

interface ErrorListDisplayProps {
  errors: ErrorDisplayItem[];
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
  title: string;
  emptyStateMessage?: string;
  emptyStateSubtext?: string;
}

export default function ErrorListDisplay({
  errors,
  elements,
  setElements,
  onOpenEditor,
  title,
  emptyStateMessage = "No errors detected",
  emptyStateSubtext = "Everything looks good!",
}: ErrorListDisplayProps) {
  // Handle hovering over an error - highlight ALL elements in the error chain
  const handleErrorHover = (hoveredError: ElementError, isHovering: boolean) => {
    // Get all element IDs that should be highlighted for this error
    const elementIdsToHighlight = new Set<number | "_">();
    
    if (hoveredError.relatedElementIds && hoveredError.relatedElementIds.length > 0) {
      // Use the relatedElementIds from the error
      hoveredError.relatedElementIds.forEach(id => elementIdsToHighlight.add(id));
    } else {
      // Fallback: find the element that has this error
      const elementWithError = elements.find((el) =>
        el.errors?.some((err) => err === hoveredError)
      );
      if (elementWithError) {
        elementIdsToHighlight.add(elementWithError.id);
      }
    }
    
    console.log('[ErrorListDisplay] Hovering error, highlighting', elementIdsToHighlight.size, 'elements:', Array.from(elementIdsToHighlight));
    
    setElements((prevElements) =>
      prevElements.map((el) =>
        elementIdsToHighlight.has(el.id)
          ? { ...el, color: isHovering ? "#3B82F6" : undefined }
          : el
      )
    );
  };

  // Handle clicking an error - open the editor for the element one layer above the deepest element
  const handleErrorClick = (error: ElementError, fallbackElementId: number | "_") => {
    let targetElementId: number | "_" = fallbackElementId;
    
    // If error has relatedElementIds, open editor for the element one layer above the deepest
    // Example: main -> list -> [1] -> primitive
    // We want to open the list editor (second-to-last in chain)
    if (error.relatedElementIds && error.relatedElementIds.length > 1) {
      // Get second-to-last element (one layer above the deepest)
      targetElementId = error.relatedElementIds[error.relatedElementIds.length - 2];
    } else if (error.relatedElementIds && error.relatedElementIds.length === 1) {
      // If only one element in chain, use it
      targetElementId = error.relatedElementIds[0];
    }
    
    const element = elements.find((el) => el.id === targetElementId);
    if (element) {
      console.log('[ErrorListDisplay] Opening editor for element', targetElementId, '(one layer above deepest)');
      onOpenEditor(element);
    }
  };

  const renderTitle = () => <h1 className={styles.title}>{title}</h1>;

  const totalErrors = errors.length;

  // No errors - success state
  if (totalErrors === 0) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          <div className={styles.noErrorsContainer}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successMessage}>{emptyStateMessage}</p>
            <p className={styles.successSubtext}>{emptyStateSubtext}</p>
          </div>
        </div>
      </>
    );
  };

  // Has errors - show the list
  return (
    <>
      {renderTitle()}
      <div className={styles.content}>
        <div className={styles.errorSummary}>
          <span className={styles.errorCount}>{totalErrors}</span>
          <span className={styles.errorLabel}>
            {totalErrors === 1 ? "error" : "errors"} found
          </span>
        </div>

        <ul className={styles.errorList}>
          {errors.map((item, index) => (
            <li
              key={index}
              className={styles.errorItem}
              onMouseEnter={() => handleErrorHover(item.error, true)}
              onMouseLeave={() => handleErrorHover(item.error, false)}
              onClick={() => handleErrorClick(item.error, item.elementId)}
            >
              <div className={styles.errorHeader}>
                <span className={styles.errorIcon}>⚠</span>
                <span className={styles.elementInfo}>
                  <strong>Element {item.elementId}</strong>
                  <span className={styles.elementType}>
                    ({item.elementType})
                  </span>
                </span>
              </div>
              <div className={styles.errorMessage}>{item.error.message}</div>
              {item.error.field && (
                <div className={styles.errorField}>
                  Field: <code>{item.error.field}</code>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
