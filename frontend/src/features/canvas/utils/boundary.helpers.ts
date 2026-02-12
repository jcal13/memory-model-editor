/**
 * Boundary collision detection and positioning utilities.
 * Prevents canvas elements from overlapping with the call stack and resolves element collisions.
 */

import { CanvasElement } from "../../shared/types";
import { getBoxDimensions } from "./box.renderer";
import { DEFAULT_CALLSTACK_WIDTH, DEFAULT_CALLSTACK_HEIGHT } from "../constants";

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
 * Default call stack boundary configuration.
 * Creates an exclusion zone from the left edge through the call stack width.
 */
export const DEFAULT_CALLSTACK_BOUNDS: CallStackBounds = {
  x: 0,
  y: 0,
  width: DEFAULT_CALLSTACK_WIDTH,
  height: DEFAULT_CALLSTACK_HEIGHT,
};

/**
 * Calculates the call stack boundary based on canvas dimensions.
 * Creates a full-height exclusion zone to prevent element placement in the call stack area.
 *
 * @param canvasHeight - Height of the canvas (defaults to window.innerHeight)
 * @param x - X-coordinate of the call stack origin
 * @param y - Y-coordinate of the call stack origin
 * @param width - Width of the call stack column
 * @returns Boundary rectangle defining the call stack exclusion zone
 */
export function getCallStackBounds(
  canvasHeight: number = window.innerHeight,
  x: number = 0,
  y: number = 0,
  width: number = DEFAULT_CALLSTACK_WIDTH
): CallStackBounds {
  let validCanvasHeight = canvasHeight;

  if (
    !validCanvasHeight ||
    validCanvasHeight <= 0 ||
    !isFinite(validCanvasHeight)
  ) {
    validCanvasHeight =
      typeof window !== "undefined" ? window.innerHeight : 1080;
  }

  const columnHeight = Math.max(400, validCanvasHeight);

  return {
    x,
    y,
    width,
    height: columnHeight,
  };
}

/**
 * Checks if a point falls within the call stack boundary.
 *
 * @param position - Point coordinates to test
 * @param callStackBounds - Call stack boundary rectangle
 * @returns True if the point is inside the call stack area
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
 * Detects if an element's bounding box overlaps with the call stack area.
 * Uses axis-aligned bounding box (AABB) collision detection.
 *
 * @param position - Center position of the element
 * @param elementDimensions - Width and height of the element
 * @param callStackBounds - Call stack boundary rectangle
 * @returns True if the element overlaps with the call stack
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

  return !(
    elementRight < callStackLeft ||
    elementLeft > callStackRight ||
    elementBottom < callStackTop ||
    elementTop > callStackBottom
  );
}

/**
 * Minimum spacing between elements and the call stack boundary.
 */
export const CALLSTACK_PADDING = 10;

/**
 * Adjusts an element's position to avoid overlap with the call stack.
 * If overlap is detected, moves the element to the right of the call stack.
 *
 * @param position - Original element position
 * @param elementDimensions - Element width and height
 * @param callStackBounds - Call stack boundary rectangle
 * @param canvasBounds - Optional canvas dimensions for boundary constraints
 * @returns Adjusted position that doesn't overlap the call stack
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

  const moveRight =
    callStackBounds.x + callStackBounds.width + elementHalfWidth + padding;

  let constrainedY = position.y;
  if (canvasBounds && canvasBounds.width > 0 && canvasBounds.height > 0) {
    constrainedY = Math.max(
      elementHalfHeight,
      Math.min(canvasBounds.height - elementHalfHeight, position.y)
    );
  }

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

/**
 * Checks if two axis-aligned bounding boxes overlap.
 * Positions are center-based coordinates.
 */
function doBoxesOverlap(
  posA: Position,
  dimA: ElementDimensions,
  posB: Position,
  dimB: ElementDimensions,
  padding: number = CALLSTACK_PADDING
): boolean {
  const aLeft = posA.x - dimA.width / 2 - padding;
  const aRight = posA.x + dimA.width / 2 + padding;
  const aTop = posA.y - dimA.height / 2 - padding;
  const aBottom = posA.y + dimA.height / 2 + padding;

  const bLeft = posB.x - dimB.width / 2;
  const bRight = posB.x + dimB.width / 2;
  const bTop = posB.y - dimB.height / 2;
  const bBottom = posB.y + dimB.height / 2;

  return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
}

/**
 * Spreads out overlapping non-function elements so they don't stack on top of each other.
 * Function elements are left untouched (they live in the callstack).
 * Returns a new array with adjusted positions.
 */
export function spreadOverlappingElements(
  elements: CanvasElement[]
): CanvasElement[] {
  if (elements.length <= 1) return elements;

  // Separate function elements (callstack) from non-function elements (canvas)
  const functionElements = elements.filter((el) => el.kind.name === "function");
  const canvasElements = elements
    .filter((el) => el.kind.name !== "function")
    .map((el) => ({ ...el }));

  if (canvasElements.length <= 1) {
    return [...functionElements, ...canvasElements];
  }

  // Get dimensions for each canvas element
  const dims = canvasElements.map((el) => getBoxDimensions(el));

  // Iteratively resolve overlaps (simple greedy approach)
  const maxIterations = canvasElements.length * 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    let hadOverlap = false;

    for (let i = 0; i < canvasElements.length; i++) {
      for (let j = i + 1; j < canvasElements.length; j++) {
        const posA = { x: canvasElements[i].x, y: canvasElements[i].y };
        const posB = { x: canvasElements[j].x, y: canvasElements[j].y };

        if (!doBoxesOverlap(posA, dims[i], posB, dims[j])) continue;

        hadOverlap = true;

        // Nudge element j to the right of element i
        const nudgeX =
          posA.x + dims[i].width / 2 + dims[j].width / 2 + CALLSTACK_PADDING;

        canvasElements[j] = { ...canvasElements[j], x: nudgeX };
      }
    }

    if (!hadOverlap) break;
  }

  // Preserve original ordering by rebuilding based on original indices
  const resultMap = new Map<number, CanvasElement>();
  for (const el of functionElements) resultMap.set(el.boxId, el);
  for (const el of canvasElements) resultMap.set(el.boxId, el);

  return elements.map((orig) => resultMap.get(orig.boxId)!);
}
