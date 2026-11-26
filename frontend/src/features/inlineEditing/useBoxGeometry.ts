import { useCallback, useEffect, useState } from "react";
import { CanvasElement } from "../shared/types";
import { BoxGeom, Rect, findBoxGroup, readBoxGeometry } from "./fields";

/** Reads one box's drawn rect and editable fields from the DOM. */
export function measureBox(
  root: HTMLElement | null,
  elements: CanvasElement[],
  boxId: number
): BoxGeom | null {
  const el = elements.find((e) => e.boxId === boxId);
  if (!el || !root) return null;
  const g = findBoxGroup(root, boxId);
  return g ? readBoxGeometry(el, g) : null;
}

/**
 * Measures the boxes the overlay is drawing chrome for (hovered, selected,
 * being edited...) from the DOM after every render, and re-renders when the
 * canvas scrolls, zooms or changes size, so outlines and inputs stay on
 * their box. `toLocal` maps a client rect into the overlay layer's CSS px.
 */
export function useBoxGeometry({
  enabled,
  wrapperRef,
  measure,
  activeBoxIds,
}: {
  enabled: boolean;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  measure: (boxId: number) => BoxGeom | null;
  activeBoxIds: number[];
}) {
  const [geoms, setGeoms] = useState<Record<number, BoxGeom>>({});
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const remeasure = useCallback(() => {
    const next: Record<number, BoxGeom> = {};
    activeBoxIds.forEach((id) => {
      const g = measure(id);
      if (g) next[id] = g;
    });
    setGeoms((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next
    );
  }, [activeBoxIds, measure]);

  // Passive effect: runs after CanvasBox children have redrawn their SVG.
  useEffect(() => {
    if (!enabled) return;
    remeasure();
  });

  useEffect(() => {
    if (!enabled) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    window.addEventListener("resize", bump);
    wrapper.addEventListener("wheel", bump, { passive: true });
    wrapper.addEventListener("scroll", bump, { passive: true });
    // The canvas itself can change size without the window doing so (a side
    // panel or the Text view opening). Wait a frame more, since the canvas
    // applies its new viewBox in a frame of its own.
    let raf2 = 0;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            cancelAnimationFrame(raf2);
            raf2 = requestAnimationFrame(bump);
          })
        : null;
    ro?.observe(wrapper);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
      ro?.disconnect();
      window.removeEventListener("resize", bump);
      wrapper.removeEventListener("wheel", bump);
      wrapper.removeEventListener("scroll", bump);
    };
  }, [enabled, wrapperRef]);

  /** Client rect → layer-local CSS px (accounts for page zoom and scroll). */
  const toLocal = useCallback(
    (r: Rect): Rect => {
      const w = wrapperRef.current;
      if (!w) return r;
      const wr = w.getBoundingClientRect();
      const k = w.offsetWidth ? wr.width / w.offsetWidth : 1;
      return {
        left: (r.left - wr.left) / k + w.scrollLeft,
        top: (r.top - wr.top) / k + w.scrollTop,
        width: r.width / k,
        height: r.height / k,
      };
    },
    [wrapperRef]
  );

  const pageZoom = () => {
    const w = wrapperRef.current;
    if (!w || !w.offsetWidth) return 1;
    return w.getBoundingClientRect().width / w.offsetWidth;
  };

  return { geoms, toLocal, pageZoom, refresh };
}
