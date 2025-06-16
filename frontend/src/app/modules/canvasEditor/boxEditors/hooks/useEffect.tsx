import { useEffect } from "react";
import { ID } from "../../shared/types";

/**
 * useModule is a custom hook that detects clicks outside the editor module
 * and automatically calls the `onSave` function with the latest element data.
 *
 * This hook handles saving logic for different element kinds:
 * - "primitive": saves type and value
 * - "function": saves name and parameters
 * - collection types ("list", "set", "tuple", "dict"): saves items or pairs
 *
 * @param moduleRef - React ref to the module DOM node
 * @param onSave - Callback to save updated element data
 * @param element - Metadata describing the element (includes kind and type)
 * @param dataType - Selected primitive type (if applicable)
 * @param contentValue - Content value for primitive (if applicable)
 * @param functionName - Name of the function (if applicable)
 * @param params - Parameters of the function (if applicable)
 * @param collectionItems - Items or pairs for collection types
 */
export const useModule = (
  moduleRef: any,
  onSave: (id: ID, data: any) => void,
  element: any,
  ownId: ID,
  dataType?: string,
  contentValue?: string,
  functionName?: string,
  params?: any[],
  collectionItems?: any
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        moduleRef.current &&                          // not the editor itself
        !moduleRef.current.contains(target) &&        // ...
        !target.closest('[data-editor-ignore]')       // not a whitelisted helper
      ) {
        const kind = element.kind.name;
        if (kind === "primitive") {
          onSave(ownId, {
            name: kind,
            type: dataType,
            value: contentValue,
          });
        } else if (kind === "function") {
          onSave(ownId, {
            name: kind,
            type: "function",
            value: null,
            functionName,
            params,
          });
        } else if (kind === "dict") {
          onSave(ownId, {
            name: kind,
            type: element.kind.type,
            value: Object.fromEntries(collectionItems || []),
          });
        } else {
          onSave(ownId, {
            name: kind,
            type: element.kind.type,
            value: collectionItems,
          });
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [
    onSave,
    ownId,
    element.kind.name,
    dataType,
    contentValue,
    functionName,
    params,
    collectionItems,
  ]);
};
