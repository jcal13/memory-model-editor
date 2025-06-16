import { PrimitiveType, FunctionParams, ID } from "../../shared/types";
import { useState } from "react";


export const useElementIdState = (element: { id: ID }) => {
  const [elementId, setElementId] = useState<ID>(element.id);
  return [elementId, setElementId] as const;
};

/**
 * Manages global UI state related to the hover status of the remove button.
 */
export const useGlobalStates = () => {
  const [hoverRemove, setHoverRemove] = useState(false);
  return {
    hoverRemove,
    setHoverRemove,
  };
};

/**
 * Initializes and manages state for primitive-type memory elements.
 *
 * @param element - The element metadata, expected to include `type` and `value`.
 * @returns [dataType, setDataType, contentValue, setContentValue]
 */
export const usePrimitiveStates = (element: any) => {
  const [dataType, setDataType] = useState<PrimitiveType>(element.kind.type);
  const [contentValue, setContentValue] = useState(element.kind.value);
  return [dataType, setDataType, contentValue, setContentValue];
};

/**
 * Initializes and manages state for function-type memory elements.
 *
 * @param element - The element metadata, expected to include `functionName` and `params`.
 * @returns [functionName, setFunctionName, functionParams, setFunctionParams]
 */
export const useFunctionStates = (element: any) => {
  const [functionName, setFunctionName] = useState(
    element.kind.functionName || ""
  );
  const [functionParams, setFunctionParams] = useState<FunctionParams[]>(
    element.kind.params || []
  );
  return [functionName, setFunctionName, functionParams, setFunctionParams];
};

/**
 * Initializes and manages state for list-like collection elements (list, set, tuple).
 *
 * @param element - The element metadata, expected to include an array `value`.
 * @returns [collectionSingles, setCollectionSingles]
 */
export const useCollectionSingleStates = (element: any) => {
  const [collectionSingles, setCollectionSingles] = useState<any[]>(
    element.kind.value || []
  );
  return [collectionSingles, setCollectionSingles];
};

/**
 * Initializes and manages state for dictionary-type collection elements.
 *
 * @param element - The element metadata, expected to include an object `value`.
 * @returns [collectionPairs, setCollectionPairs]
 */
export const useCollectionPairsStates = (element: any) => {
  const [collectionPairs, setCollectionPairs] = useState(
    Object.entries(element.kind.value || {})
  );
  return [collectionPairs, setCollectionPairs];
};
