import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus handling for a modal dialog while it is mounted:
 * - moves focus inside (unless something inside already has it, e.g. autoFocus),
 * - keeps Tab / Shift+Tab inside,
 * - on close, returns focus to whatever had it before (if it still exists).
 */
export function useDialogFocus(ref: React.RefObject<HTMLElement | null>, active = true) {
  // Remember the opener while rendering: by the time effects run, an
  // autoFocus button inside the dialog has already taken focus.
  const wasActive = useRef(false);
  const opener = useRef<Element | null>(null);
  /** Bumped on every effect run, so a stale restore (StrictMode's dev-only
   *  unmount/remount) can tell the dialog is still open and do nothing. */
  const run = useRef(0);
  if (active && !wasActive.current) opener.current = document.activeElement;
  wasActive.current = active;

  useEffect(() => {
    if (!active) return;
    const myRun = ++run.current;
    const previous = opener.current as HTMLElement | SVGElement | null;
    const root = ref.current;
    const items = () => (root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : []);
    if (root && !root.contains(document.activeElement)) (items()[0] ?? root).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !root) return;
      const list = items();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // Let the click/keypress that closed the dialog finish first.
      setTimeout(() => {
        // Reading the latest value is the point: a newer run means re-mounted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (run.current !== myRun) return; // Re-mounted: still open.
        const now = document.activeElement;
        const lost = !now || now === document.body || (root ? root.contains(now) || !document.contains(now) : false);
        if (lost && previous && document.contains(previous) && "focus" in previous) previous.focus();
      }, 0);
    };
  }, [ref, active]);
}
