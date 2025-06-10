import { useEffect } from "react";

// save the set data type to the UI
export const useDataType = (dataTypeRef: any, dataType: any) => {
  useEffect(() => {
    dataTypeRef.current = dataType;
  }, [dataType]);
};

export const useContentValue = (contentValueRef: any, contentValue: any) => {
  useEffect(() => {
    contentValueRef.current = contentValue;
  }, [contentValue]);
};

export const useModule = (
  moduleRef: any,
  dataTypeRef: any,
  contentValueRef: any,
  onSave: any,
  element: any
) => {
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (moduleRef.current && !moduleRef.current.contains(e.target as Node)) {
        onSave({
          name: element.kind.name,
          type: dataTypeRef.current,
          value: contentValueRef.current,
        });
      }
    };
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("mousedown", outside);
    };
  }, [onSave, element.kind.name]);
};
