/**
 * Master Error List utilities for MemoryModelEditor
 * 
 * Provides types and helper functions for working with aggregated
 * errors across all canvas elements (both validation and feedback errors).
 */

import { CanvasElement, ElementError } from "../../shared/types";

/**
 * Represents an element with its associated errors
 */
export interface ElementErrorEntry {
  element: CanvasElement;
  errors: ElementError[];
}

/**
 * Master error list type - maps boxId to element error entries
 */
export type MasterErrorList = Map<number, ElementErrorEntry>;

/**
 * Creates a master error list from canvas elements
 * @param elements - Array of canvas elements
 * @returns Map of boxId to element error entries
 */
export function createMasterErrorList(elements: CanvasElement[]): MasterErrorList {
  const errorMap = new Map<number, ElementErrorEntry>();
  
  elements.forEach((element) => {
    if (element.errors && element.errors.length > 0) {
      errorMap.set(element.boxId, {
        element,
        errors: element.errors,
      });
    }
  });
  
  return errorMap;
}

/**
 * Gets total error count across all elements
 * @param errorList - Master error list
 * @returns Total number of errors
 */
export function getTotalErrorCount(errorList: MasterErrorList): number {
  let count = 0;
  errorList.forEach((entry) => {
    count += entry.errors.length;
  });
  return count;
}

/**
 * Gets total number of elements with errors
 * @param errorList - Master error list
 * @returns Number of elements that have errors
 */
export function getElementsWithErrorsCount(errorList: MasterErrorList): number {
  return errorList.size;
}

/**
 * Checks if a specific element has errors
 * @param errorList - Master error list
 * @param boxId - Box ID to check
 * @returns True if element has errors
 */
export function hasErrors(errorList: MasterErrorList, boxId: number): boolean {
  return errorList.has(boxId);
}

/**
 * Gets errors for a specific element
 * @param errorList - Master error list
 * @param boxId - Box ID to get errors for
 * @returns Array of errors or empty array
 */
export function getErrorsForElement(
  errorList: MasterErrorList,
  boxId: number
): ElementError[] {
  const entry = errorList.get(boxId);
  return entry ? entry.errors : [];
}

/**
 * Gets all elements with errors as an array
 * @param errorList - Master error list
 * @returns Array of element error entries
 */
export function getAllErrorEntries(errorList: MasterErrorList): ElementErrorEntry[] {
  return Array.from(errorList.values());
}

/**
 * Gets a summary of all errors grouped by error type
 * @param errorList - Master error list
 * @returns Map of error type to count
 */
export function getErrorSummaryByType(errorList: MasterErrorList): Map<string, number> {
  const summary = new Map<string, number>();
  
  errorList.forEach((entry) => {
    entry.errors.forEach((error) => {
      const currentCount = summary.get(error.type) || 0;
      summary.set(error.type, currentCount + 1);
    });
  });
  
  return summary;
}

/**
 * Converts master error list to a flat array of all errors with element context
 * @param errorList - Master error list
 * @returns Array of errors with element information
 */
export function flattenErrorList(errorList: MasterErrorList): Array<{
  boxId: number;
  elementId: number | "_";
  elementType: string;
  error: ElementError;
}> {
  const flattened: Array<{
    boxId: number;
    elementId: number | "_";
    elementType: string;
    error: ElementError;
  }> = [];
  
  errorList.forEach((entry) => {
    entry.errors.forEach((error) => {
      flattened.push({
        boxId: entry.element.boxId,
        elementId: entry.element.id,
        elementType: entry.element.kind.name,
        error,
      });
    });
  });
  
  return flattened;
}
