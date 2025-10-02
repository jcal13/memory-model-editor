import styles from "./QuestionSelector.module.css";

type QuestionStatus = "unattempted" | "attempted" | "completed";

interface QuestionSelectorProps {
  text: string;
  onClick?: () => void;
  status?: QuestionStatus;
}

export default function QuestionSelector({
  text,
  onClick,
  status = "unattempted",
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

  return (
    <button
      type="button"
      className={`${styles.selectorBtn} ${getStatusClass()}`}
      onClick={onClick}
      data-status={status}
    >
      {text}
    </button>
  );
}
