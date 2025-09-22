import styles from "./QuestionSelector.module.css";

interface QuestionSelectorProps {
  text: string;
  onClick?: () => void;
}

export default function QuestionSelector({
  text,
  onClick,
}: QuestionSelectorProps) {
  return (
    <button type="button" className={styles.selectorBtn} onClick={onClick}>
      {text}
    </button>
  );
}
