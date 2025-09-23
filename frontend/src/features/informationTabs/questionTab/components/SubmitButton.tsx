import styles from "./SubmitButton.module.css";

interface SubmitButtonProps {
  onClick: () => Promise<void>;
}

export function SubmitButton({ onClick }: SubmitButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.baseButton} ${styles.submitButton}`}
      onClick={onClick}
      aria-label="Submit Canvas"
      title="Submit Canvas"
    >
      Submit
    </button>
  );
}
