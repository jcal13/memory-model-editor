import React from "react";
import HelpIcon from "../../../shared/components/HelpIcon";
import styles from "./QuestionSelector.module.css";

type QuestionStatus = "unattempted" | "attempted" | "completed";

interface QuestionSelectorProps {
  text: string;
  onClick?: () => void;
  status?: QuestionStatus;
  variant?: "category" | "pill";
  icon?: string;
  subtitle?: string;
  categoryType?: "practice" | "test" | "prep" | "experiment" | "stepbystep";
}

export default function QuestionSelector({
  text,
  onClick,
  status = "unattempted",
  variant = "pill",
  icon,
  subtitle,
  categoryType,
  helpText,
}: QuestionSelectorProps) {
  const getStatusClass = () => {
    switch (status) {
      case "completed":
        return styles.completed;
      case "attempted":
        return styles.attempted;
      default:
        return "";
    }
  };

  if (variant === "category") {
    // Rendered as a div (not a button) because it contains its own nested
    // HelpIcon button — a <button> can't validly contain another <button>.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.();
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        className={styles.categoryBtn}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        {icon && (
          <span
            className={`${styles.categoryIcon} ${
              categoryType === "practice"
                ? styles.practice
                : categoryType === "test"
                ? styles.test
                : categoryType === "prep"
                ? styles.prep
                : categoryType === "experiment"
                ? styles.experiment
                : categoryType === "stepbystep"
                ? styles.stepbystep
                : ""
            }`}
          >
            {icon}
          </span>
        )}
        <span className={styles.categoryLabel}>
          <span className={styles.categoryTitleRow}>
            <span className={styles.categoryTitle}>{text}</span>
            {helpText && <HelpIcon text={helpText} title={text} />}
          </span>
          {subtitle && (
            <span className={styles.categorySubtitle}>{subtitle}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.selectorBtn} ${getStatusClass()}`}
      onClick={onClick}
      data-status={status}
    >
      <span className={`${styles.statusDot} ${styles[status]}`} />
      {text}
    </button>
  );
}
