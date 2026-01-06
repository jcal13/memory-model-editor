/**
 * Boundary utility functions for preventing canvas elements from overlapping with the callstack
 */

export interface CallStackBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ElementDimensions {
  width: number;
  height: number;
}

/**
 * Default callstack positioning - boundary extends from left edge to callstack right edge
 * and from top to bottom of canvas to prevent any elements from being placed to the left
 */
export const DEFAULT_CALLSTACK_BOUNDS: CallStackBounds = {
  x: 0,
  y: 0,
  width: 225,
  height: 400,
};

/**
 * Calculates the actual callstack bounds based on canvas height
 * The boundary extends from the left edge of the canvas through the callstack area
 * to provide a full exclusion zone that prevents elements from being placed to the left of the callstack
 * The boundary extends to the full height of the canvas (top to bottom)
 */
export function getCallStackBounds(
  canvasHeight: number = window.innerHeight,
  x: number = 0,
  y: number = 0,
  width: number = 225
): CallStackBounds {
  // Ensure we have a valid canvas height, falling back to window height if needed
  let validCanvasHeight = canvasHeight;

  if (
    !validCanvasHeight ||
    validCanvasHeight <= 0 ||
    !isFinite(validCanvasHeight)
  ) {
    validCanvasHeight =
      typeof window !== "undefined" ? window.innerHeight : 1080;
  }

  // Extend the boundary from top to bottom of the canvas
  const columnHeight = Math.max(400, validCanvasHeight);

  return {
    x,
    y,
    width,
    height: columnHeight,
  };
}

/**
 * Checks if a point overlaps with the callstack area
 */
export function isPointInCallStack(
  position: Position,
  callStackBounds: CallStackBounds
): boolean {
  return (
    position.x >= callStackBounds.x &&
    position.x <= callStackBounds.x + callStackBounds.width &&
    position.y >= callStackBounds.y &&
    position.y <= callStackBounds.y + callStackBounds.height
  );
}

/**
 * Checks if an element with given position and dimensions overlaps with the callstack
 */
export function isElementOverlappingCallStack(
  position: Position,
  elementDimensions: ElementDimensions,
  callStackBounds: CallStackBounds
): boolean {
  const elementLeft = position.x - elementDimensions.width / 2;
  const elementRight = position.x + elementDimensions.width / 2;
  const elementTop = position.y - elementDimensions.height / 2;
  const elementBottom = position.y + elementDimensions.height / 2;

  const callStackLeft = callStackBounds.x;
  const callStackRight = callStackBounds.x + callStackBounds.width;
  const callStackTop = callStackBounds.y;
  const callStackBottom = callStackBounds.y + callStackBounds.height;

  // Check for overlap using axis-aligned bounding box collision detection
  return !(
    elementRight < callStackLeft ||
    elementLeft > callStackRight ||
    elementBottom < callStackTop ||
    elementTop > callStackBottom
  );
}

export const CALLSTACK_PADDING = 10;

/**
 * Constrains a position to avoid overlapping with the callstack
 * Returns the nearest valid position if the original position would cause overlap
 * Since the callstack boundary extends from top to bottom of the canvas,
 * elements are always moved to the right side of the callstack
 */
export function constrainPositionAwayFromCallStack(
  position: Position,
  elementDimensions: ElementDimensions,
  callStackBounds: CallStackBounds,
  canvasBounds?: { width: number; height: number }
): Position {
  if (
    !isElementOverlappingCallStack(position, elementDimensions, callStackBounds)
  ) {
    return position;
  }

  const elementHalfWidth = elementDimensions.width / 2;
  const elementHalfHeight = elementDimensions.height / 2;
  const padding = CALLSTACK_PADDING;

  // Since the callstack boundary extends from top to bottom, always move to the right
  const moveRight =
    callStackBounds.x + callStackBounds.width + elementHalfWidth + padding;

  // Constrain Y position to stay within canvas bounds
  let constrainedY = position.y;
  if (canvasBounds && canvasBounds.width > 0 && canvasBounds.height > 0) {
    constrainedY = Math.max(
      elementHalfHeight,
      Math.min(canvasBounds.height - elementHalfHeight, position.y)
    );
  }

  // Check if moving right is valid within canvas bounds
  const rightPositionValid =
    !canvasBounds ||
    (canvasBounds.width > 0 &&
      canvasBounds.height > 0 &&
      moveRight <= canvasBounds.width - elementHalfWidth &&
      moveRight >= elementHalfWidth);

  if (rightPositionValid) {
    return { x: moveRight, y: constrainedY };
  }

  // If moving right would go outside canvas, constrain to the right edge of canvas
  const constrainedX =
    canvasBounds && canvasBounds.width > 0
      ? canvasBounds.width - elementHalfWidth
      : moveRight;
  return { x: constrainedX, y: constrainedY };
}

/**
 * Smoothly constrains a position during dragging to prevent overlap with callstack
 * Unlike constrainPositionAwayFromCallStack, this doesn't teleport but smoothly blocks movement
 */
export function smoothlyConstrainDragPosition(
  position: Position,
  elementDimensions: ElementDimensions,
  callStackBounds: CallStackBounds,
  canvasBounds?: { width: number; height: number }
): Position {
  const elementHalfWidth = elementDimensions.width / 2;
  const elementHalfHeight = elementDimensions.height / 2;

  let constrainedX = position.x;
  let constrainedY = position.y;

  // Apply canvas bounds first, with validation
  if (canvasBounds && canvasBounds.width > 0 && canvasBounds.height > 0) {
    constrainedX = Math.max(
      elementHalfWidth,
      Math.min(canvasBounds.width - elementHalfWidth, constrainedX)
    );
    constrainedY = Math.max(
      elementHalfHeight,
      Math.min(canvasBounds.height - elementHalfHeight, constrainedY)
    );
  }

  // Calculate the callstack boundary with padding
  const padding = CALLSTACK_PADDING;
  const callStackLeft = callStackBounds.x;
  const callStackRight = callStackBounds.x + callStackBounds.width + padding;
  const callStackTop = callStackBounds.y;
  const callStackBottom = callStackBounds.y + callStackBounds.height;

  // Check if element would overlap with the callstack boundary (including padding)
  const elementLeft = constrainedX - elementHalfWidth;
  const elementTop = constrainedY - elementHalfHeight;
  const elementBottom = constrainedY + elementHalfHeight;

  // Check if element overlaps vertically with the callstack
  const verticalOverlap = !(
    elementBottom < callStackTop || elementTop > callStackBottom
  );

  // If there's vertical overlap and the element would enter the forbidden horizontal zone,
  // constrain the X position to keep the element's left edge at the boundary
  if (verticalOverlap && elementLeft < callStackRight) {
    // Position the element so its left edge just touches the right edge of the callstack boundary
    constrainedX = callStackRight + elementHalfWidth;
  }

  return { x: constrainedX, y: constrainedY };
}
