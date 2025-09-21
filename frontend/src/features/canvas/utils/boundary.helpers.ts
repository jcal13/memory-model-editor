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
  x: 0, // Boundary starts at left edge of canvas
  y: 0, // Boundary starts at top of canvas
  width: 250, // Extends to cover the callstack area (20px margin + 230px callstack width)
  height: 400, // Will be dynamically calculated based on canvas height
};

/**
 * Calculates the actual callstack bounds based on canvas height
 * The boundary extends from the left edge of the canvas through the callstack area
 * to provide a full exclusion zone that prevents elements from being placed to the left of the callstack
 * The boundary extends to the full height of the canvas (top to bottom)
 */
export function getCallStackBounds(
  canvasHeight: number = window.innerHeight,
  x: number = 0, // Start from left edge of canvas
  y: number = 0, // Start from top of canvas
  width: number = 250 // Cover the callstack area (20px margin + 230px callstack width)
): CallStackBounds {
  // Extend the boundary from top to bottom of the canvas
  const columnHeight = Math.max(400, canvasHeight);
  
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
  if (!isElementOverlappingCallStack(position, elementDimensions, callStackBounds)) {
    return position;
  }

  const elementHalfWidth = elementDimensions.width / 2;
  const elementHalfHeight = elementDimensions.height / 2;
  const padding = CALLSTACK_PADDING;

  // Since the callstack boundary extends from top to bottom, always move to the right
  const moveRight = callStackBounds.x + callStackBounds.width + elementHalfWidth + padding;

  // Constrain Y position to stay within canvas bounds
  let constrainedY = position.y;
  if (canvasBounds) {
    constrainedY = Math.max(elementHalfHeight, Math.min(canvasBounds.height - elementHalfHeight, position.y));
  }

  // Check if moving right is valid within canvas bounds
  const rightPositionValid = !canvasBounds || (moveRight <= canvasBounds.width - elementHalfWidth && moveRight >= elementHalfWidth);

  if (rightPositionValid) {
    return { x: moveRight, y: constrainedY };
  }

  // If moving right would go outside canvas, constrain to the right edge of canvas
  const constrainedX = canvasBounds ? canvasBounds.width - elementHalfWidth : moveRight;
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

  // Apply canvas bounds first
  if (canvasBounds) {
    constrainedX = Math.max(elementHalfWidth, Math.min(canvasBounds.width - elementHalfWidth, constrainedX));
    constrainedY = Math.max(elementHalfHeight, Math.min(canvasBounds.height - elementHalfHeight, constrainedY));
  }

  // Calculate the forbidden zone boundaries
  const callStackLeft = callStackBounds.x;
  const callStackRight = callStackBounds.x + callStackBounds.width;
  const callStackTop = callStackBounds.y;
  const callStackBottom = callStackBounds.y + callStackBounds.height;

  // Calculate where the element's edges would be
  const elementLeft = constrainedX - elementHalfWidth;
  const elementRight = constrainedX + elementHalfWidth;
  const elementTop = constrainedY - elementHalfHeight;
  const elementBottom = constrainedY + elementHalfHeight;

  // Check if element would overlap horizontally with callstack
  const horizontalOverlap = !(elementRight < callStackLeft || elementLeft > callStackRight);
  
  // Check if element would overlap vertically with callstack
  const verticalOverlap = !(elementBottom < callStackTop || elementTop > callStackBottom);

  // If there would be an overlap, prevent it by constraining the position
  if (horizontalOverlap && verticalOverlap) {
    // Since the callstack boundary extends from top to bottom of the canvas,
    // always move elements to the right side of the callstack
    const padding = CALLSTACK_PADDING;
    constrainedX = callStackBounds.x + callStackBounds.width + elementHalfWidth + padding;
  }

  return { x: constrainedX, y: constrainedY };
}

/**
 * Gets the padding around the callstack for boundary calculations
 */
export const CALLSTACK_PADDING = 10;
