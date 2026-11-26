import styles from "./CanvasToolbar.module.css";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const STEP = 0.1;
const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Always-visible controls in the canvas corner: zoom out / reset / in, and
 * the Grid Layout toggle. (The same settings stay in Canvas Controls.)
 */
export default function CanvasToolbar({
  scale,
  onScaleChange,
  gridLayout,
  onGridLayoutChange,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
  gridLayout: boolean;
  onGridLayoutChange: (on: boolean) => void;
}) {
  const percent = `${Math.round(scale * 100)}%`;
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Canvas view">
      <button
        type="button"
        className={styles.button}
        onClick={() => onScaleChange(Math.max(MIN_SCALE, round(scale - STEP)))}
        disabled={scale <= MIN_SCALE}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.percent}`}
        onClick={() => onScaleChange(1)}
        aria-label={`Zoom ${percent}, reset to 100%`}
        title="Reset zoom to 100%"
      >
        {percent}
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={() => onScaleChange(Math.min(MAX_SCALE, round(scale + STEP)))}
        disabled={scale >= MAX_SCALE}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <span className={styles.divider} aria-hidden="true" />
      <button
        type="button"
        className={`${styles.button} ${styles.grid} ${gridLayout ? styles.on : ""}`}
        aria-pressed={gridLayout}
        onClick={() => onGridLayoutChange(!gridLayout)}
        title={gridLayout ? "Grid Layout on: boxes snap to cells" : "Grid Layout: snap boxes to cells"}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M1.5 1.5h5v5h-5zM9.5 1.5h5v5h-5zM1.5 9.5h5v5h-5zM9.5 9.5h5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Grid
      </button>
    </div>
  );
}
