import { useRef } from "react";
import { PrimitiveType } from "../../shared/types";

export const useRefs = (dataType: any, contentValue: any) => {
  const moduleRef = useRef<HTMLDivElement>(null);
  const dataTypeRef = useRef<PrimitiveType>(dataType);
  const contentValueRef = useRef<string>(contentValue);
  return {
    moduleRef,
    dataTypeRef,
    contentValueRef,
  };
};
