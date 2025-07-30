import styles from "../styles/QuestionSelector.module.css";

interface Props {
  text: string;
  onClick?: () => void;
}

const QuestionSelector: React.FC<Props> = ({ text, onClick }) => (
  <button type="button" className={styles.selectorBtn} onClick={onClick}>
    {text}
  </button>
);

export default QuestionSelector;
