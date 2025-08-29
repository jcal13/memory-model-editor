import { useEffect, useRef } from "react";
import { ID } from "../../shared/types";

/**
 * useModule is a custom hook that saves the current editor state
 * whenever any of its reactive inputs change.
 *
 * The editor stays open and pushes an update on every data change,
 * ensuring the canvas always reflects the latest values.
 *
 * Payload structure is unchanged, so existing consumers still work:
 * ─ "primitive": { name, type, value }
 * ─ "function" : { name, type: "function", value: null, functionName, params }
 * ─ collections: { name, type, value }  // list, set, tuple, dict
 *
 * @param onSave          Callback invoked as onSave(id, data)
 * @param element         Element metadata (includes kind & type)
 * @param ownId           Current element ID
 * @param dataType        Primitive type (if applicable)
 * @param contentValue    Primitive value (if applicable)
 * @param functionName    Function name (if applicable)
 * @param params          Function parameters (if applicable)
 * @param collectionItems Items / pairs for collections
 */
export const useModule = (
  onSave: (id: ID, data: any, invalidated?: boolean) => void,
  element: any,
  ownId: ID,
  dataType?: string,
  contentValue?: string,
  functionName?: string,
  params?: any[],
  collectionItems?: any,
  className?: string,
  classVariables?: any[],
  invalidated?: boolean // <-- NEW
) => {
  const prevRef = useRef<{
    id: ID;
    payload: any;
    invalidated?: boolean;
  } | null>(null);

  const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || !a || !b)
      return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const k of keys) if (!isEqual(a[k], b[k])) return false;
    return true;
  };

  useEffect(() => {
    const kind = element.kind.name;
    let payload: any;

    if (kind === "primitive") {
      payload = { name: kind, type: dataType, value: contentValue };
    } else if (kind === "function") {
      payload = {
        name: kind,
        type: "function",
        value: null,
        functionName,
        params,
      };
    } else if (kind === "dict") {
      payload = {
        name: kind,
        type: element.kind.type,
        value: Object.fromEntries(collectionItems ?? []),
      };
    } else if (kind === "class") {
      payload = {
        name: kind,
        type: "class",
        value: null,
        className,
        classVariables,
      };
    } else {
      payload = { name: kind, type: element.kind.type, value: collectionItems };
    }

    const prev = prevRef.current;
    if (
      prev &&
      prev.id === ownId &&
      isEqual(prev.payload, payload) &&
      prev.invalidated === invalidated
    ) {
      return;
    }

    prevRef.current = { id: ownId, payload, invalidated };
    onSave(ownId, payload, invalidated); // <-- forward invalidated with the live payload
  }, [
    onSave,
    ownId,
    element.kind.name,
    element.kind.type,
    dataType,
    contentValue,
    functionName,
    params,
    collectionItems,
    className,
    classVariables,
    invalidated,
  ]);
};

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
export function useSingleClassPanelRegistry(
  open: boolean,
  closeSelf: () => void
) {
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
