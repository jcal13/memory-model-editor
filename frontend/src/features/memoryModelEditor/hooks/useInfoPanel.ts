import { useEffect } from "react";

// Layout constants
const MIN_INFO_PANEL_WIDTH = 100;
const MAX_INFO_PANEL_VIEWPORT_RATIO = 0.6667;
const INFO_PANEL_OFFSET = 100;

interface UseInfoPanelResizeParams {
  isResizingInfoPanel: boolean;
  isInfoPanelOpen: boolean;
  mainContainerRef: React.RefObject<HTMLDivElement | null>;
  setInfoPanelWidth: (width: number) => void;
  setIsResizingInfoPanel: (isResizing: boolean) => void;
}

/**
 * Hook that handles info panel resizing functionality
 * @param params - Configuration for info panel resize behavior
 */
export function useInfoPanelResize({
  isResizingInfoPanel,
  isInfoPanelOpen,
  mainContainerRef,
  setInfoPanelWidth,
  setIsResizingInfoPanel,
}: UseInfoPanelResizeParams): void {
  // Prevent text selection when resizing starts
  useEffect(() => {
    if (isResizingInfoPanel) {
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }
  }, [isResizingInfoPanel]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (
        !isResizingInfoPanel ||
        !mainContainerRef.current ||
        !isInfoPanelOpen
      ) {
        return;
      }

      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - event.clientX;

      // Calculate maximum allowed width
      const maxWidthBasedOnViewport =
        window.innerWidth * MAX_INFO_PANEL_VIEWPORT_RATIO;
      const maxAllowedWidth = Math.min(
        containerRect.width - INFO_PANEL_OFFSET,
        maxWidthBasedOnViewport
      );

      // Apply width constraints
      if (newWidth >= MIN_INFO_PANEL_WIDTH && newWidth <= maxAllowedWidth) {
        setInfoPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingInfoPanel) {
        setIsResizingInfoPanel(false);
        // Re-enable text selection after resize
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      }
    };

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizingInfoPanel,
    isInfoPanelOpen,
    mainContainerRef,
    setInfoPanelWidth,
    setIsResizingInfoPanel,
  ]);
}
