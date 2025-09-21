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
 * Default callstack positioning - boundary extends from top to bottom of canvas
 */
export const DEFAULT_CALLSTACK_BOUNDS: CallStackBounds = {
  x: 20,
  y: 0, // Boundary starts at top of canvas
  width: 230,
  height: 400, // Will be dynamically calculated based on viewport
};

/**
 * Calculates the actual callstack bounds based on viewport height
 * The boundary extends from the top of the canvas to provide a full vertical exclusion zone
 */
export function getCallStackBounds(
  viewportHeight: number = window.innerHeight,
  x: number = 20,
  y: number = 0, // Start from top of canvas
  width: number = 230
): CallStackBounds {
  // Extend the boundary from top to bottom of the viewport
  const columnHeight = Math.max(400, viewportHeight - 10);
  
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
 * Prioritizes moving to the right side of the callstack where there's more canvas space
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

  // Calculate potential positions to move the element away from callstack
  const moveRight = callStackBounds.x + callStackBounds.width + elementHalfWidth + padding;
  const moveLeft = callStackBounds.x - elementHalfWidth - padding;
  const moveUp = callStackBounds.y - elementHalfHeight - padding;
  const moveDown = callStackBounds.y + callStackBounds.height + elementHalfHeight + padding;

  // Prioritize moving to the right side first (where there's more space)
  const options = [
    { 
      direction: 'right', 
      position: { x: moveRight, y: position.y },
      valid: !canvasBounds || (moveRight <= canvasBounds.width - elementHalfWidth && moveRight >= elementHalfWidth)
    },
    { 
      direction: 'down', 
      position: { x: position.x, y: moveDown },
      valid: !canvasBounds || (moveDown <= canvasBounds.height - elementHalfHeight && moveDown >= elementHalfHeight)
    },
    { 
      direction: 'up', 
      position: { x: position.x, y: moveUp },
      valid: !canvasBounds || (moveUp >= elementHalfHeight && moveUp <= canvasBounds.height - elementHalfHeight)
    },
    { 
      direction: 'left', 
      position: { x: moveLeft, y: position.y },
      valid: !canvasBounds || (moveLeft >= elementHalfWidth && moveLeft <= canvasBounds.width - elementHalfWidth)
    },
  ];

  // Find the first valid option
  for (const option of options) {
    if (option.valid) {
      return option.position;
    }
  }

  // If no perfect position is found, return the right side position as fallback
  // This ensures the element is at least clear of the callstack
  return { x: moveRight, y: position.y };
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
    // Calculate distances to move to each edge to avoid overlap
    const distanceToLeft = elementRight - callStackLeft;
    const distanceToRight = callStackRight - elementLeft;
    const distanceToTop = elementBottom - callStackTop;
    const distanceToBottom = callStackBottom - elementTop;

    // Choose the direction that requires the smallest movement
    const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

    if (minDistance === distanceToLeft) {
      // Move left to avoid overlap
      constrainedX = callStackLeft - elementHalfWidth;
    } else if (minDistance === distanceToRight) {
      // Move right to avoid overlap
      constrainedX = callStackRight + elementHalfWidth;
    } else if (minDistance === distanceToTop) {
      // Move up to avoid overlap
      constrainedY = callStackTop - elementHalfHeight;
    } else {
      // Move down to avoid overlap
      constrainedY = callStackBottom + elementHalfHeight;
    }
  }

  return { x: constrainedX, y: constrainedY };
}

/**
 * Gets the padding around the callstack for boundary calculations
 */
export const CALLSTACK_PADDING = 10;
