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
  // Handle hovering over an error - highlight the associated element
  const handleErrorHover = (elementId: number | "_", isHovering: boolean) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === elementId
          ? { ...el, color: isHovering ? "#3B82F6" : undefined }
          : el
      )
    );
  };

  // Handle clicking an error - open the editor for the associated element
  const handleErrorClick = (elementId: number | "_") => {
    const element = elements.find((el) => el.id === elementId);
    if (element) {
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
              onMouseEnter={() => handleErrorHover(item.elementId, true)}
              onMouseLeave={() => handleErrorHover(item.elementId, false)}
              onClick={() => handleErrorClick(item.elementId)}
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
