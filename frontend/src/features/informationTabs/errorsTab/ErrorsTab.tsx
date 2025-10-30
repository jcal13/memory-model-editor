import { MasterErrorList, flattenErrorList, getTotalErrorCount } from "../../memoryModelEditor/utils/masterErrorList";
import { CanvasElement } from "../../shared/types";
import styles from "./ErrorsTab.module.css";

interface ErrorsTabProps {
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
}

export default function ErrorsTab({ 
  masterErrorList, 
  elements,
  setElements,
  onOpenEditor 
}: ErrorsTabProps) {
  
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
  const renderTitle = () => <h1 className={styles.title}>Validation Errors</h1>;

  const totalErrors = getTotalErrorCount(masterErrorList);

  // No errors - success state
  if (totalErrors === 0) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          <div className={styles.noErrorsContainer}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successMessage}>
              No validation errors detected
            </p>
            <p className={styles.successSubtext}>
              Your memory model is valid and ready to submit.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Has errors - show the list
  const allErrors = flattenErrorList(masterErrorList);

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
          {allErrors.map((item, index) => (
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
                  <span className={styles.elementType}>({item.elementType})</span>
                </span>
              </div>
              <div className={styles.errorMessage}>
                {item.error.message}
              </div>
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
