import { useMemo } from "react";
import { CanvasElement } from "../../shared/types";
import { buildModelOutline } from "../utils/modelText";
import styles from "./ModelTextView.module.css";
import a11y from "../../a11y/a11y.module.css";

/**
 * A text outline of the memory model, kept in sync with the canvas. Always
 * present for screen readers (headings + lists); with `visible` it is also
 * shown as a panel, where clicking a line focuses that box on the canvas.
 * The hidden version has no focusable parts, so it adds no invisible Tab stops.
 */
export default function ModelTextView({
  elements,
  inlinePrimitives = false,
  visible = false,
  onFocusBox,
}: {
  elements: CanvasElement[];
  inlinePrimitives?: boolean;
  visible?: boolean;
  onFocusBox?: (boxId: number) => void;
}) {
  const outline = useMemo(
    () => buildModelOutline(elements, { inlinePrimitives }),
    [elements, inlinePrimitives]
  );

  const line = (l: { boxId: number; text: string }) => (
    <li key={l.boxId}>
      {visible && onFocusBox ? (
        <button type="button" className={styles.item} onClick={() => onFocusBox(l.boxId)}
          title="Go to this box on the canvas">
          {l.text}
        </button>
      ) : (
        l.text
      )}
    </li>
  );

  return (
    <section
      className={visible ? styles.panel : a11y.srOnly}
      aria-labelledby="model-text-view-title"
      data-inline-ui
      data-testid="model-text-view"
      data-text-view-visible={visible || undefined}
    >
      <h2 id="model-text-view-title" className={styles.title}>Text view of the memory model</h2>
      <p className={styles.summary}>{outline.summary}</p>
      <h3 className={styles.section}>Call stack</h3>
      {outline.frames.length ? (
        <ul className={styles.list}>{outline.frames.map(line)}</ul>
      ) : (
        <p className={styles.empty}>No frames</p>
      )}
      <h3 className={styles.section}>Objects</h3>
      {outline.objects.length ? (
        <ul className={styles.list}>{outline.objects.map(line)}</ul>
      ) : (
        <p className={styles.empty}>No objects</p>
      )}
    </section>
  );
}
