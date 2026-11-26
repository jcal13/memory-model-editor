import { ReactNode } from "react";
import styles from "./PanelToggleButtons.module.css";

/**
 * A slim, in-flow rail shown in place of a collapsed side panel. It keeps the
 * panel discoverable (label + expand button) and can hold a few always-useful
 * actions, while giving the rest of the width to the canvas.
 */
export default function PanelRail({
  side,
  label,
  shortcut,
  onExpand,
  children,
}: {
  side: "left" | "right";
  label: string;
  shortcut?: string;
  onExpand: () => void;
  children?: ReactNode;
}) {
  const title = `Show ${label}${shortcut ? ` (${shortcut})` : ""}`;
  return (
    <div className={`${styles.rail} ${side === "left" ? styles.railLeft : styles.railRight}`} data-tour={`${side}-rail`}>
      <button className={styles.railExpand} onClick={onExpand} aria-label={title} title={title}>
        <Chevron direction={side === "left" ? "right" : "left"} />
      </button>
      <button className={styles.railLabel} onClick={onExpand} tabIndex={-1} aria-hidden="true">
        {label}
      </button>
      {children && <div className={styles.railActions}>{children}</div>}
    </div>
  );
}

export function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={direction === "right" ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
    </svg>
  );
}

export function RailButton({ title, onClick, disabled, children }: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button className={styles.railButton} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
