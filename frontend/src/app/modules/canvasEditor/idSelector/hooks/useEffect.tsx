import { useEffect } from "react";

/* ===========================================================================
   === 1.  Keep a local list in sync with a source array                   ===
   ====================================================================== */
export function useIdListSync<T>(
  source: T[],
  setLocal: React.Dispatch<React.SetStateAction<T[]>>
) {
  useEffect(() => setLocal(source), [source, setLocal]);
}

// Holds the closer for whichever Id-selector panel is currently open
let closeCurrentPanel: (() => void) | null = null;

/**
 * Registers a selector panel with the global registry so that only one can
 * remain open at any given time.
 *
 * @param open      – this panel’s `open` state
 * @param closeSelf – a **stable** callback that closes this panel
 */
export function useSinglePanelRegistry(open: boolean, closeSelf: () => void) {
  useEffect(() => {
    if (open) {
      // Close any previously-open panel before registering this one
      if (closeCurrentPanel && closeCurrentPanel !== closeSelf) {
        closeCurrentPanel();
      }
      closeCurrentPanel = closeSelf;
    } else if (closeCurrentPanel === closeSelf) {
      // Deregister this panel when it closes
      closeCurrentPanel = null;
    }

    // Cleanup if the component unmounts while it is the active panel
    return () => {
      if (closeCurrentPanel === closeSelf) {
        closeCurrentPanel = null;
      }
    };
  }, [open, closeSelf]);
}
