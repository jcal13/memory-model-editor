import { useRef } from "react";

/** Provides a stable ref for the draggable Class-selector panel container. */
export function useClassPanelRef() {
  return useRef<HTMLDivElement | null>(null);
}
