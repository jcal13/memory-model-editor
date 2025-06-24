import { useRef } from "react";

/** Provides a stable ref for the draggable Id-selector panel container. */
export function usePanelRef() {
  return useRef<HTMLDivElement | null>(null);
}
