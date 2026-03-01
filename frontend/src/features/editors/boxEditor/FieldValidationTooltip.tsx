import React, { useState } from "react";
import styles from "./FieldValidationTooltip.module.css";
import { ElementError } from "../../shared/types";

interface FieldValidationTooltipProps {
  errors: ElementError[];
  children: React.ReactNode;
}

/**
 * A tooltip that wraps around an input field and displays validation errors
 * specific to that field when hovered.
 */
export default function FieldValidationTooltip({
  errors,
  children,
}: FieldValidationTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!errors || errors.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipArrow} />
          <div className={styles.tooltipContent}>
            {errors.map((error, idx) => (
              <div key={idx} className={styles.errorItem}>
                <span className={styles.errorIcon}>⚠</span>
                <span className={styles.errorMessage}>{error.message}</span>
                {error.invalidId !== undefined && (
                  <span className={styles.invalidId}>
                    (ID: {error.invalidId})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
