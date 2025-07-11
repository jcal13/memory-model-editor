import { useEffect } from "react";

// Syncs class name list from source to local
export function useClassListSync<T>(
  source: T[],
  setLocal: React.Dispatch<React.SetStateAction<T[]>>
) {
  useEffect(() => setLocal(source), [source, setLocal]);
}

// global variable for holding current class panel state
let closeCurrentClassPanel: (() => void) | null = null;

/**
 * Registers a class selector panel with the global registry so that only one can
 * remain open at any given time.
 *
 * @param open      – this panel’s `open` state
 * @param closeSelf – a **stable** callback that closes this panel
 */
export function useSingleClassPanelRegistry(open: boolean, closeSelf: () => void) {
  useEffect(() => {
    if (open) {
      // remove previously open class panel ptrs before registering this one
      if (closeCurrentClassPanel && closeCurrentClassPanel !== closeSelf) {
        closeCurrentClassPanel();
      }
      closeCurrentClassPanel = closeSelf;
    } else if (closeCurrentClassPanel === closeSelf) {
      // release ptr to this panel when it closes
      closeCurrentClassPanel = null;
    }

    // cleanup if the component unmounts while it is the active class panel
    return () => {
      if (closeCurrentClassPanel === closeSelf) {
        closeCurrentClassPanel = null;
      }
    };
  }, [open, closeSelf]);
}
