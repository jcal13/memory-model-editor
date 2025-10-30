import { useEffect, useRef } from "react";

const CLOSE_BOTH_PANELS_WIDTH = 1024;
const CLOSE_PALETTE_WIDTH = 1280;

interface UseResponsivePanelsParams {
  isPaletteOpen: boolean;
  isInfoPanelOpen: boolean;
  setIsPaletteOpen: (open: boolean) => void;
  setIsInfoPanelOpen: (open: boolean) => void;
}

export function useResponsivePanels({
  isPaletteOpen,
  isInfoPanelOpen,
  setIsPaletteOpen,
  setIsInfoPanelOpen,
}: UseResponsivePanelsParams): void {
  const lastWidthRef = useRef<number>(window.innerWidth);
  const hasManuallyToggledRef = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const previousWidth = lastWidthRef.current;
      lastWidthRef.current = width;

      if (previousWidth === width) return;

      hasManuallyToggledRef.current = false;

      if (width < CLOSE_BOTH_PANELS_WIDTH) {
        if (isPaletteOpen) setIsPaletteOpen(false);
        if (isInfoPanelOpen) setIsInfoPanelOpen(false);
      } else if (width < CLOSE_PALETTE_WIDTH) {
        if (isPaletteOpen) setIsPaletteOpen(false);
        if (!isInfoPanelOpen) setIsInfoPanelOpen(true);
      } else {
        if (!isPaletteOpen) setIsPaletteOpen(true);
        if (!isInfoPanelOpen) setIsInfoPanelOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isPaletteOpen, isInfoPanelOpen, setIsPaletteOpen, setIsInfoPanelOpen]);
}
