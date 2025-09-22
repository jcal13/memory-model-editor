import { useRef } from "react";

export function useMemoryModelEditorRefs() {
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  return {
    mainContainerRef,
  };
}
