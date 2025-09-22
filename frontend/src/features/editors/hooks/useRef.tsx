import { useRef } from "react";

/**
 * Custom hook to create and return a ref for the editor module container.
 * This ref is used to detect outside clicks or apply transformations to the editor.
 *
 * @returns A React ref pointing to the module's root HTMLDivElement
 */
export const useGlobalRefs = () => {
  const moduleRef = useRef<HTMLDivElement>(null);
  return moduleRef;
};

export function usePanelRef() {
  return useRef<HTMLDivElement | null>(null);
}

/** Provides a stable ref for the draggable Class-selector panel container. */
export function useClassPanelRef() {
  return useRef<HTMLDivElement | null>(null);
}
