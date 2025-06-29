import { useEffect } from "react";

export function useIdListSync<T>(
  source: T[],
  setLocal: React.Dispatch<React.SetStateAction<T[]>>
) {
  useEffect(() => setLocal(source), [source, setLocal]);
}

// global variable for holding current panel state
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
      // remove previously open panel ptrs before registering this one
      if (closeCurrentPanel && closeCurrentPanel !== closeSelf) {
        closeCurrentPanel();
      }
      closeCurrentPanel = closeSelf;
    } else if (closeCurrentPanel === closeSelf) {
      // release ptr to this panel when it closes
      closeCurrentPanel = null;
    }

    // cleanup if the component unmounts while it is the active panel
    return () => {
      if (closeCurrentPanel === closeSelf) {
        closeCurrentPanel = null;
      }
    };
  }, [open, closeSelf]);
}
