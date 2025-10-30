/**
 * Canvas element validation utilities
 * 
 * Provides validation logic for detecting errors in canvas elements,
 * such as dangling references, invalid IDs, etc.
 */

import { CanvasElement, ValidationError, ValidationErrorType } from "../../shared/types";

/**
 * Validates all canvas elements and returns them with validation errors attached
 * @param elements - Array of canvas elements to validate
 * @returns Array of elements with validationErrors populated
 */
export function validateElements(elements: CanvasElement[]): CanvasElement[] {
  // Create a set of all valid IDs in the canvas
  // Exclude invalidated boxes - they are treated as "deleted"
  const validIds = new Set<number>();
  
  elements.forEach((el) => {
    if (typeof el.id === "number" && !el.invalidated) {
      validIds.add(el.id);
    }
  });

  // Validate each element
  return elements.map((element) => validateElement(element, validIds));
}

/**
 * Validates a single canvas element for errors
 * @param element - The element to validate
 * @param validIds - Set of all valid IDs in the canvas
 * @returns Element with validationErrors populated
 */
function validateElement(
  element: CanvasElement,
  validIds: Set<number>
): CanvasElement {
  const errors: ValidationError[] = [];
  const kindName = element.kind.name;

  switch (kindName) {
    case "list":
    case "tuple":
    case "set":
      // Check for dangling references in sequences
      if (Array.isArray(element.kind.value)) {
        element.kind.value.forEach((refId, index) => {
          if (typeof refId === "number" && !validIds.has(refId)) {
            errors.push({
              type: ValidationErrorType.DANGLING_REFERENCE,
              message: `Element at index ${index} references non-existent object with ID ${refId}`,
              field: `value[${index}]`,
              invalidId: refId,
            });
          }
        });
      }
      break;

    case "dict":
      // Check for dangling references in dictionary values
      if (element.kind.value && typeof element.kind.value === "object") {
        Object.entries(element.kind.value).forEach(([key, refId]) => {
          if (typeof refId === "number" && !validIds.has(refId)) {
            errors.push({
              type: ValidationErrorType.DANGLING_REFERENCE,
              message: `Dictionary key "${key}" references non-existent object with ID ${refId}`,
              field: `value.${key}`,
              invalidId: refId,
            });
          }
        });
      }
      break;

    case "function":
      // Check for dangling references in function parameters
      if (Array.isArray(element.kind.params)) {
        element.kind.params.forEach((param, index) => {
          if (
            param.targetId !== null &&
            typeof param.targetId === "number" &&
            !validIds.has(param.targetId)
          ) {
            errors.push({
              type: ValidationErrorType.DANGLING_REFERENCE,
              message: `Parameter "${param.name}" references non-existent object with ID ${param.targetId}`,
              field: `params[${index}]`,
              invalidId: param.targetId,
            });
          }
        });
      }
      break;

    case "class":
      // Check for dangling references in class variables
      if (Array.isArray(element.kind.classVariables)) {
        element.kind.classVariables.forEach((variable, index) => {
          if (
            variable.targetId !== null &&
            typeof variable.targetId === "number" &&
            !validIds.has(variable.targetId)
          ) {
            errors.push({
              type: ValidationErrorType.DANGLING_REFERENCE,
              message: `Class variable "${variable.name}" references non-existent object with ID ${variable.targetId}`,
              field: `classVariables[${index}]`,
              invalidId: variable.targetId,
            });
          }
        });
      }
      break;

    case "primitive":
      // Primitives don't have references to validate
      break;

    default:
      break;
  }

  return {
    ...element,
    validationErrors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Checks if an element has any validation errors
 * @param element - The element to check
 * @returns True if the element has validation errors
 */
export function hasValidationErrors(element: CanvasElement): boolean {
  return !!element.validationErrors && element.validationErrors.length > 0;
}

/**
 * Gets a summary error message for an element
 * @param element - The element to get error summary for
 * @returns Summary error message or empty string
 */
export function getErrorSummary(element: CanvasElement): string {
  if (!hasValidationErrors(element)) {
    return "";
  }

  const errorCount = element.validationErrors!.length;
  return errorCount === 1
    ? "1 validation error"
    : `${errorCount} validation errors`;
}
