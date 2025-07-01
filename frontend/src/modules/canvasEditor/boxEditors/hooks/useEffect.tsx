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
  onSave: (id: ID, data: any) => void,
  element: any,
  ownId: ID,
  dataType?: string,
  contentValue?: string,
  functionName?: string,
  params?: any[],
  collectionItems?: any
) => {
  /* Cache of the last payload we actually saved */
  const prevPayloadRef = useRef<any>(null);

  /* Lightweight deep comparison (good enough for our payloads) */
  const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!isEqual(a[k], b[k])) return false;
    }
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
    } else {
      payload = {
        name: kind,
        type: element.kind.type,
        value: collectionItems,
      };
    }

    if (isEqual(prevPayloadRef.current, payload)) return;

    prevPayloadRef.current = payload;   // update cache
    onSave(ownId, payload);             // persist changes
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
  ]);
};
