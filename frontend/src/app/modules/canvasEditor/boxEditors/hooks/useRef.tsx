import { useRef } from "react";
import { PrimitiveType } from "../../shared/types";

export const useGlobalRefs = () => {
  const moduleRef = useRef<HTMLDivElement>(null);
  return moduleRef;
};

export const usePrimitiveRefs = (dataType: any, contentValue: any) => {
  const dataTypeRef = useRef<PrimitiveType>(dataType);
  const contentValueRef = useRef<string>(contentValue);
  return {
    dataTypeRef,
    contentValueRef,
  };
};

// export const useFunctionRefs = () => {

// }
