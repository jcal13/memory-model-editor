import React from "react";
import { ValidationError } from "../../shared/types";
import styles from "./ValidationErrorDisplay.module.css";

interface ValidationErrorDisplayProps {
  errors?: ValidationError[];
}

/**
 * Component to display validation errors in the box editor
 */
const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <svg
          className={styles.errorIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h4 className={styles.errorTitle}>
          {errors.length === 1 ? "1 Validation Error" : `${errors.length} Validation Errors`}
        </h4>
      </div>
      <ul className={styles.errorList}>
        {errors.map((error, index) => (
          <li key={index} className={styles.errorItem}>
            <div className={styles.errorMessage}>{error.message}</div>
            {error.invalidId !== undefined && (
              <div className={styles.errorDetail}>
                Invalid ID: <span className={styles.invalidId}>{error.invalidId}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationErrorDisplay;
