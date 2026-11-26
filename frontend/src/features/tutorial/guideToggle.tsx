import { useSyncExternalStore } from "react";

/**
 * Lets the question panel header show the tutorial's Show/Hide guide button
 * while the guide's state stays in Tutorial.
 */
type GuideToggle = { visible: boolean; toggle: () => void } | null;

let current: GuideToggle = null;
const listeners = new Set<() => void>();

export function setGuideToggle(next: GuideToggle) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function useGuideToggle(): GuideToggle {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => current,
    () => null,
  );
}

/** The Show/Hide guide button, rendered wherever the host wants it. */
export function GuideToggleButton({ className }: { className?: string }) {
  const guide = useGuideToggle();
  if (!guide) return null;
  return (
    <button type="button" className={className} aria-pressed={guide.visible} onClick={guide.toggle}>
      {guide.visible ? "Hide guide" : "Show guide"}
    </button>
  );
}
