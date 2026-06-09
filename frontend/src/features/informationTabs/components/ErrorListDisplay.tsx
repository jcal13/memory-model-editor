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
  title?: string;
  showTitle?: boolean;
  isSandboxMode?: boolean;
}

export default function ErrorListDisplay({
  errors,
  elements,
  setElements,
  title = "Errors",
  showTitle = true,
  isSandboxMode = false,
}: ErrorListDisplayProps) {
  const handleErrorHover = (
    hoveredError: ElementError,
    isHovering: boolean
  ) => {
    const elementIdsToHighlight = new Set<number | "_">();

    if (
      hoveredError.relatedElementIds &&
      hoveredError.relatedElementIds.length > 0
    ) {
      hoveredError.relatedElementIds.forEach((id) =>
        elementIdsToHighlight.add(id)
      );
    } else {
      const elementWithError = elements.find((el) =>
        el.errors?.some((err) => err === hoveredError)
      );
      if (elementWithError) {
        elementIdsToHighlight.add(elementWithError.id);
      }
    }

    setElements((prevElements) =>
      prevElements.map((el) =>
        elementIdsToHighlight.has(el.id)
          ? { ...el, color: isHovering ? "#DC2626" : undefined } // Changed to RED
          : el
      )
    );
  };

  const processErrorMessage = (
    message: string,
    isSandboxMode: boolean
  ): string => {
    if (!isSandboxMode) {
      return message;
    }

    let processed = message;

    // Do not edit messages that have "unexpected" in it
    if (!message.toLowerCase().includes("unexpected")) {
      processed = processed.replace(/expected\s+[^,]+,\s+got\s+/gi, "got ");
      processed = processed.replace(/,?\s*expected\s+[^,]+$/gi, "");
      processed = processed.replace(/(Missing function):\s*"[^"]+"/gi, "$1");
      processed = processed.replace(/expected\s+"[^"]+"/gi, "");
    }

    return processed.trim();
  };

  const parseErrorMessage = (
    error: ElementError,
    isSandboxMode: boolean
  ) => {
    const message = error.message;
    const displayMessage = processErrorMessage(message, isSandboxMode);
  
    if (error.title) {
      return { displayMessage, errorType: error.title };
    }
  
    let errorType = "";
  
    if (message.includes("Missing variable")) {
      errorType = "Missing variable";
    } else if (message.includes("Unexpected variable")) {
      errorType = "Unexpected variable";
    } else if (message.includes("Function count mismatch")) {
      errorType = "Function count mismatch";
    } else if (message.includes("Missing function")) {
      errorType = "Missing element";
    } else if (message.includes("Value mismatch")) {
      errorType = "Incorrect value";
    } else if (message.includes("Type mismatch")) {
      errorType = "Type mismatch";
    } else if (message.includes("Missing")) {
      errorType = "Missing element";
    } else if (message.includes("Unexpected")) {
      errorType = "Unexpected element";
    } else {
      errorType = "Error";
    }
  
    return { displayMessage, errorType };
  };

  const renderTitle = () =>
    showTitle ? <h1 className={styles.title}>{title}</h1> : null;

  const totalErrors = errors.length;

  if (totalErrors === 0) {
    return <>{renderTitle()}</>;
  }

  return (
    <>
      {renderTitle()}
      <div className={styles.content}>
        <div className={styles.errorSummary}>
          <span className={styles.errorCount}>{totalErrors}</span>
          <span className={styles.errorLabel}>
            {totalErrors === 1 ? "issue found" : "issues found"}
          </span>
        </div>

        <ul className={styles.errorList}>
          {errors.map((item, index) => {
            const { displayMessage, errorType } = parseErrorMessage(
              item.error,
              isSandboxMode
            );

            return (
              <li
                key={index}
                className={styles.errorItem}
                onMouseEnter={() => handleErrorHover(item.error, true)}
                onMouseLeave={() => handleErrorHover(item.error, false)}
              >
                <div className={styles.errorHeader}>
                  <span className={styles.errorIcon}>⚠</span>
                  <span className={styles.errorType}>{errorType}</span>
                </div>
                <div className={styles.errorMessage}>{displayMessage}</div>
                {item.error.field && (
                  <div className={styles.errorField}>
                    Field: <code>{item.error.field}</code>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
