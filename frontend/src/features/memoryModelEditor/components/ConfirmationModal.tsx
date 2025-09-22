import styles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not on child elements
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className={styles.modalContainer}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        aria-label="Close modal"
      />

      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            {title}
          </h2>
        </header>

        <main className={styles.modalContent}>
          <p id="modal-message" className={styles.modalMessage}>
            {message}
          </p>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
              autoFocus
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
