import { useRef } from "react";

/**
 * Custom hook to create and return a ref for the editor module container.
 * This ref is used to detect outside clicks or apply transformations to the editor.
 *
 * @returns A React ref pointing to the module's root HTMLDivElement
 */
export const useGlobalRefs = () => {
  const moduleRef = useRef<HTMLDivElement>(null);
  return moduleRef;
};
