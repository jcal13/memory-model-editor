import styles from "../../styles/MemoryModelEditor.module.css";

type Props = { onClick: () => void };

export default function ClearCanvasButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.clearCanvasButton}
      onClick={onClick}
      aria-label="Clear Canvas"
      title="Clear Canvas"
    >
      Clear
    </button>
  );
}
