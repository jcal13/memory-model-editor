import { PrimitiveType, FunctionParams } from "../../shared/types";
import { useState } from "react";

export const useGlobalStates = () => {
  const [hoverRemove, setHoverRemove] = useState(false);
  return {
    hoverRemove,
    setHoverRemove,
  };
};

export const usePrimitiveStates = (element: any) => {
  const [dataType, setDataType] = useState<PrimitiveType>(element.kind.type);
  const [contentValue, setContentValue] = useState(element.kind.value);
  return [dataType, setDataType, contentValue, setContentValue];
};

export const useFunctionStates = (element: any) => {
  const [functionName, setFunctionName] = useState(
    element.kind.functionName || ""
  );
  const [functionParams, setFunctionParams] = useState<FunctionParams[]>(
    element.kind.params || []
  );
  return [functionName, setFunctionName, functionParams, setFunctionParams];
};
