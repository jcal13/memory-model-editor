/**
 * Editor-related custom hooks for managing editor state and lifecycle.
 * Consolidates state management, synchronization, and panel registry logic.
 */

import { useEffect, useRef, useState } from "react";
import { ID, PrimitiveType, FunctionParams } from "../../shared/types";

/**
 * Manages the ID state for an editor element.
 */
export const useElementIdState = (element: { id: ID }) => {
  const [elementId, setElementId] = useState<ID>(element.id);
  return [elementId, setElementId] as const;
};

/**
 * Manages global UI state for editor controls (e.g., hover states).
 */
export const useGlobalStates = () => {
  const [hoverRemove, setHoverRemove] = useState(false);
  return {
    hoverRemove,
    setHoverRemove,
  };
};

/**
 * Manages state for primitive-type elements (int, float, str, bool, None).
 */
export const usePrimitiveStates = (element: any) => {
  const [dataType, setDataType] = useState<PrimitiveType>(element.kind.type);
  const [contentValue, setContentValue] = useState(element.kind.value);
  return [dataType, setDataType, contentValue, setContentValue] as const;
};

/**
 * Manages state for function-type elements (name and parameters).
 */
export const useFunctionStates = (element: any) => {
  const [functionName, setFunctionName] = useState(
    element.kind.functionName || ""
  );
  const [functionParams, setFunctionParams] = useState<FunctionParams[]>(
    element.kind.params || []
  );
  return [functionName, setFunctionName, functionParams, setFunctionParams] as const;
};

/**
 * Manages state for collection elements (list, set, tuple).
 */
export const useCollectionSingleStates = (element: any) => {
  const [collectionSingles, setCollectionSingles] = useState<any[]>(
    element.kind.value || []
  );
  return [collectionSingles, setCollectionSingles] as const;
};

/**
 * Manages state for dictionary elements (key-value pairs).
 */
export const useCollectionPairsStates = (element: any) => {
  const [collectionPairs, setCollectionPairs] = useState(
    Object.entries(element.kind.value || {})
  );
  return [collectionPairs, setCollectionPairs] as const;
};

/**
 * Manages state for class-type elements (name and instance variables).
 */
export const useClassStates = (element: any) => {
  const [className, setClassName] = useState<string>(
    element.kind.className ?? ""
  );

  const rawVars: any[] = element.kind.classVariables ?? [];
  const normalized = rawVars.map((v: any) => ({
    name: v.name ?? v.key ?? "",
    targetId: v.targetId ?? v.value ?? null,
  }));
  const [classVariables, setClassVariables] = useState<FunctionParams[]>(normalized);

  return [className, setClassName, classVariables, setClassVariables] as const;
};

/**
 * Manages invalidation state for an element (whether it contains errors).
 */
export const useInvalidatedState = (element: any) => {
  const [invalidated, setInvalidated] = useState<boolean>(
    (element.invalidated as boolean) || false
  );
  const onToggleInvalidated = () => {
    setInvalidated(!invalidated);
  };
  return [invalidated, onToggleInvalidated] as const;
};

/**
 * Auto-saves editor changes whenever dependencies change.
 * Prevents unnecessary saves by comparing current and previous payloads.
 */
export const useEditorAutoSave = (
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
  invalidated?: boolean
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
    onSave(ownId, payload, invalidated);
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

/**
 * Synchronizes an external source array with local state.
 */
export function useListSync<T>(
  source: T[],
  setLocal: React.Dispatch<React.SetStateAction<T[]>>
) {
  useEffect(() => setLocal(source), [source, setLocal]);
}

let closeCurrentPanel: (() => void) | null = null;

/**
 * Ensures only one ID selector panel is open at a time.
 * Automatically closes other panels when a new one opens.
 */
export function useSinglePanelRegistry(open: boolean, closeSelf: () => void) {
  useEffect(() => {
    if (open) {
      if (closeCurrentPanel && closeCurrentPanel !== closeSelf) {
        closeCurrentPanel();
      }
      closeCurrentPanel = closeSelf;
    } else if (closeCurrentPanel === closeSelf) {
      closeCurrentPanel = null;
    }

    return () => {
      if (closeCurrentPanel === closeSelf) {
        closeCurrentPanel = null;
      }
    };
  }, [open, closeSelf]);
}

let closeCurrentClassPanel: (() => void) | null = null;

/**
 * Ensures only one class selector panel is open at a time.
 * Automatically closes other class panels when a new one opens.
 */
export function useSingleClassPanelRegistry(
  open: boolean,
  closeSelf: () => void
) {
  useEffect(() => {
    if (open) {
      if (closeCurrentClassPanel && closeCurrentClassPanel !== closeSelf) {
        closeCurrentClassPanel();
      }
      closeCurrentClassPanel = closeSelf;
    } else if (closeCurrentClassPanel === closeSelf) {
      closeCurrentClassPanel = null;
    }

    return () => {
      if (closeCurrentClassPanel === closeSelf) {
        closeCurrentClassPanel = null;
      }
    };
  }, [open, closeSelf]);
}

/**
 * Creates a ref for the editor module container.
 */
export const useGlobalRefs = () => {
  const moduleRef = useRef<HTMLDivElement>(null);
  return moduleRef;
};

/**
 * Creates a ref for the ID selector panel.
 */
export function usePanelRef() {
  return useRef<HTMLDivElement | null>(null);
}

/**
 * Creates a ref for the class selector panel.
 */
export function useClassPanelRef() {
  return useRef<HTMLDivElement | null>(null);
}

let closeCurrentFunctionPanel: (() => void) | null = null;

/**
 * Ensures only one function name selector panel is open at a time.
 */
export function useSingleFunctionPanelRegistry(
  open: boolean,
  closeSelf: () => void
) {
  useEffect(() => {
    if (open) {
      if (closeCurrentFunctionPanel && closeCurrentFunctionPanel !== closeSelf) {
        closeCurrentFunctionPanel();
      }
      closeCurrentFunctionPanel = closeSelf;
    } else if (closeCurrentFunctionPanel === closeSelf) {
      closeCurrentFunctionPanel = null;
    }
    return () => {
      if (closeCurrentFunctionPanel === closeSelf) {
        closeCurrentFunctionPanel = null;
      }
    };
  }, [open, closeSelf]);
}

/**
 * Creates a ref for the function name selector panel.
 */
export function useFunctionPanelRef() {
  return useRef<HTMLDivElement | null>(null);
}
