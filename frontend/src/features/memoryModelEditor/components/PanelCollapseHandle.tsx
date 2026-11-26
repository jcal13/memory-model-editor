import styles from "./PanelToggleButtons.module.css";
import { Chevron } from "./PanelToggleButtons";

/** A collapse button sitting on a panel's resize divider. */
export default function PanelCollapseHandle({
  direction,
  label,
  onCollapse,
}: {
  direction: "left" | "right";
  label: string;
  onCollapse: () => void;
}) {
  return (
    <button
      className={styles.collapseHandle}
      title={label}
      aria-label={label}
      // Don't start a divider resize.
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onCollapse}
    >
      <Chevron direction={direction} />
    </button>
  );
}
