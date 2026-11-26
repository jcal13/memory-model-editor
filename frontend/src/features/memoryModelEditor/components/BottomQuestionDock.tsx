import { ReactNode, useEffect, useRef, useState } from "react";
import { uiScale } from "../../shared/uiScale";
import { Chevron } from "./PanelToggleButtons";
import styles from "./BottomQuestionDock.module.css";

const STORAGE_KEY = "memorylab_bottom_dock_height";
const MIN_HEIGHT = 160;
/** Leave at least this much of the column for the canvas. */
const MIN_CANVAS = 220;

const readHeight = () => {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(v) && v >= MIN_HEIGHT ? v : null;
  } catch {
    return null;
  }
};

/**
 * Experimental layout: the question + feedback docked under the canvas.
 * A drag bar resizes it (height remembered); collapsed it is a thin bar.
 */
export default function BottomQuestionDock({
  open,
  onOpenChange,
  columnRef,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The canvas column (holds the `data-tour="canvas"` area), used to clamp the height. */
  columnRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [height, setHeight] = useState<number>(
    () => readHeight() ?? Math.round((window.innerHeight / uiScale()) * 0.36)
  );
  /** Pointer y, dock height and the most it may grow, when the drag began. */
  const [drag, setDrag] = useState<{ y: number; height: number; max: number } | null>(null);
  const heightRef = useRef(height);
  heightRef.current = height;

  useEffect(() => {
    if (!drag) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    // Grow by however far the pointer moved since the drag began. (Measuring
    // to the column's bottom counted any panel below the dock, such as the
    // Linked List view, and made the height jump.)
    const move = (e: MouseEvent) => {
      const next = drag.height + (drag.y - e.clientY) / uiScale();
      setHeight(Math.max(MIN_HEIGHT, Math.min(drag.max, next)));
    };
    const up = () => {
      setDrag(null);
      try {
        localStorage.setItem(STORAGE_KEY, String(Math.round(heightRef.current)));
      } catch {
        /* storage unavailable */
      }
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [drag, columnRef]);

  // A smaller window (or a panel opening below) must not squeeze the canvas
  // under MIN_CANVAS: give height back from the dock (not saved).
  useEffect(() => {
    const col = columnRef.current;
    if (!open || !col || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const canvas = col.querySelector('[data-tour="canvas"]');
      if (!canvas) return;
      const canvasHeight = canvas.getBoundingClientRect().height / uiScale();
      if (canvasHeight < MIN_CANVAS - 1)
        setHeight((h) => Math.max(MIN_HEIGHT, h - (MIN_CANVAS - canvasHeight)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(col);
    const canvas = col.querySelector('[data-tour="canvas"]');
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  }, [open, columnRef]);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.collapsedBar}
        data-tour="bottom-rail"
        aria-label="Show question (])"
        title="Show question (])"
        onClick={() => onOpenChange(true)}
      >
        <Chevron direction="left" />
        <span>Question &amp; feedback</span>
        <kbd>]</kbd>
      </button>
    );
  }

  return (
    <>
      <div
        className={styles.divider}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize question panel"
        onMouseDown={(e) => {
          // The dock may take canvas height down to MIN_CANVAS, no further.
          const canvas = columnRef.current?.querySelector('[data-tour="canvas"]');
          const canvasHeight = canvas ? canvas.getBoundingClientRect().height / uiScale() : 0;
          const height = heightRef.current;
          setDrag({ y: e.clientY, height, max: Math.max(height, height + canvasHeight - MIN_CANVAS) });
        }}
      >
        <button
          type="button"
          className={styles.collapse}
          aria-label="Hide question (])"
          title="Hide question (])"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onOpenChange(false)}
        >
          <Chevron direction="right" />
        </button>
      </div>
      <div data-tour="info-panel" className={styles.dock} style={{ height }}>
        {children}
      </div>
    </>
  );
}
