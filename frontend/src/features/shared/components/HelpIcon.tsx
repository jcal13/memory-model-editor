import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./HelpIcon.module.css";

interface HelpIconProps {
  /** The explanatory text shown in the popup when the icon is clicked. */
  text: string;
  /** Optional heading shown above the explanation. */
  title?: string;
  className?: string;
}

/**
 * Small "?" icon that, when clicked, opens a centered dialog over a blurred
 * backdrop with a brief explanation. Used to clarify features that aren't
 * self-explanatory.
 */
export default function HelpIcon({ text, title, className }: HelpIconProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Stop clicks/mousedowns from bubbling so the icon can sit inside
  // clickable parents (e.g. category buttons) without triggering them.
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <button
        type="button"
        className={`${styles.icon} ${className ?? ""}`}
        onClick={(e) => {
          stopPropagation(e);
          setIsOpen(true);
        }}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        aria-label={title ? `Help: ${title}` : "Help"}
        aria-haspopup="dialog"
      >
        ?
      </button>

      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
            role="presentation"
          >
            <div
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-label={title ?? "Help"}
              onClick={stopPropagation}
            >
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              {title && <h4 className={styles.dialogTitle}>{title}</h4>}
              <p className={styles.dialogText}>{text}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
