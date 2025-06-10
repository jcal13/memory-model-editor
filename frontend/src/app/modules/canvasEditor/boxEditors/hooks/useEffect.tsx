import { useEffect } from "react";

export const useModule = (
  moduleRef: any,
  onSave: (data: any) => void,
  element: any,
  dataType?: string,
  contentValue?: string,
  functionName?: string,
  params?: any[],
  collectionItems?: any
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleRef.current && !moduleRef.current.contains(e.target as Node)) {
        const kind = element.kind.name;

        if (kind === "primitive") {
          onSave({
            name: kind,
            type: dataType,
            value: contentValue,
          });
        } else if (kind === "function") {
          onSave({
            name: kind,
            type: "function",
            value: null,
            functionName,
            params,
          });
        } else {
          onSave({
            name: kind,
            type: element.kind.type,
            value: collectionItems,
          });
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    onSave,
    element.kind.name,
    dataType,
    contentValue,
    functionName,
    params,
    collectionItems,
  ]);
};
