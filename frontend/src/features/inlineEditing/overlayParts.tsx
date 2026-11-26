import React, { useLayoutEffect, useRef } from "react";
import styles from "./InlineEditing.module.css";

/** Small presentational pieces of the inline editing overlay. */

export function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

/**
 * The chip list under an inline input. It is centred on the input, but kept
 * inside the visible canvas: narrowed to fit (so chips wrap onto more lines)
 * and nudged sideways near an edge instead of being clipped.
 */
export function ChipTray({
  boundsRef,
  children,
}: {
  boundsRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const wrap = boundsRef.current;
    if (!el || !wrap) return;
    const margin = 8;
    el.style.marginLeft = "0px";
    el.style.maxWidth = `${Math.max(120, Math.min(320, wrap.clientWidth - margin * 2))}px`;
    const w = wrap.getBoundingClientRect();
    const k = w.width / (wrap.offsetWidth || 1) || 1; // page zoom
    const r = el.getBoundingClientRect();
    const minLeft = w.left + margin * k;
    const maxRight = w.left + (wrap.clientWidth - margin) * k;
    let shift = 0;
    if (r.right > maxRight) shift = maxRight - r.right;
    if (r.left + shift < minLeft) shift = minLeft - r.left;
    el.style.marginLeft = `${shift / k}px`;
  });
  return (
    <div ref={ref} className={styles.chips} onMouseDown={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}
