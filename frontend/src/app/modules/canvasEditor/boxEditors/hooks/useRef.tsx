import { useRef } from "react";

export const useGlobalRefs = () => {
  const moduleRef = useRef<HTMLDivElement>(null);
  return moduleRef;
};
