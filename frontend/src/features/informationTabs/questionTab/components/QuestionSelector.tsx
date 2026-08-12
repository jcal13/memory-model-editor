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
    return (
      <button
        type="button"
        className={styles.categoryBtn}
        onClick={onClick}
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
          <span className={styles.categoryTitle}>{text}</span>
          {subtitle && (
            <span className={styles.categorySubtitle}>{subtitle}</span>
          )}
        </span>
      </button>
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
