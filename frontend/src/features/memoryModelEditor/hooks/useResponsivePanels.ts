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
  const userHasClosedPaletteRef = useRef<boolean>(false);
  const userHasClosedInfoRef = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const previousWidth = lastWidthRef.current;
      lastWidthRef.current = width;

      if (previousWidth === width) return;

      if (
        !isPaletteOpen &&
        previousWidth >= CLOSE_PALETTE_WIDTH &&
        width >= CLOSE_PALETTE_WIDTH
      ) {
        userHasClosedPaletteRef.current = true;
      }
      if (
        !isInfoPanelOpen &&
        previousWidth >= CLOSE_BOTH_PANELS_WIDTH &&
        width >= CLOSE_BOTH_PANELS_WIDTH
      ) {
        userHasClosedInfoRef.current = true;
      }

      if (width < CLOSE_BOTH_PANELS_WIDTH) {
        if (isPaletteOpen) setIsPaletteOpen(false);
        if (isInfoPanelOpen) setIsInfoPanelOpen(false);
      } else if (width < CLOSE_PALETTE_WIDTH) {
        if (isPaletteOpen) setIsPaletteOpen(false);
        if (!isInfoPanelOpen && !userHasClosedInfoRef.current) {
          setIsInfoPanelOpen(true);
        }
      } else {
        if (!isPaletteOpen && !userHasClosedPaletteRef.current) {
          setIsPaletteOpen(true);
        }
        if (!isInfoPanelOpen && !userHasClosedInfoRef.current) {
          setIsInfoPanelOpen(true);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isPaletteOpen, isInfoPanelOpen, setIsPaletteOpen, setIsInfoPanelOpen]);

  useEffect(() => {
    if (isPaletteOpen) {
      userHasClosedPaletteRef.current = false;
    }
  }, [isPaletteOpen]);

  useEffect(() => {
    if (isInfoPanelOpen) {
      userHasClosedInfoRef.current = false;
    }
  }, [isInfoPanelOpen]);
}
