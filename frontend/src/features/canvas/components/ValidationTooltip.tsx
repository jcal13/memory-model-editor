import React from "react";
import { ValidationError } from "../../shared/types";
import styles from "./ValidationTooltip.module.css";

interface ValidationTooltipProps {
  errors: ValidationError[];
  visible: boolean;
}

/**
 * Tooltip component that displays validation errors on hover
 */
const ValidationTooltip: React.FC<ValidationTooltipProps> = ({
  errors,
  visible,
}) => {
  if (!visible || !errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <svg
          className={styles.tooltipIcon}
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
        <span className={styles.tooltipTitle}>
          {errors.length === 1 ? "1 Error" : `${errors.length} Errors`}
        </span>
      </div>
      <div className={styles.tooltipContent}>
        {errors.map((error, index) => (
          <div key={index} className={styles.errorItem}>
            <div className={styles.errorMessage}>{error.message}</div>
            {error.invalidId !== undefined && (
              <div className={styles.errorDetail}>
                Invalid ID: <span className={styles.invalidId}>{error.invalidId}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.tooltipArrow} />
    </div>
  );
};

export default ValidationTooltip;
