import React from "react";
import styles from "./styles/ConfirmationModal.module.css";

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
  return (
    <div className={styles.panelContainer}>
      <div className={styles.backdrop} onClick={onCancel} />

      <div className={styles.panel}>
        <div className={styles.header}>{title}</div>

        <div className={styles.content}>
          <span className={styles.message}>{message}</span>

          <div className={styles.actions}>
            <button className={styles.removeButton} onClick={onConfirm}>
              {confirmLabel}
            </button>
            <button className={styles.trigger} onClick={onCancel}>
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
