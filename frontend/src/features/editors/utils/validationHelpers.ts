/**
 * Editor validation utilities
 * 
 * Provides helper functions for checking and displaying validation errors
 * in editor components.
 */

import { ElementError } from "../../shared/types";

/**
 * Checks if a specific field has validation errors
 * @param errors - Array of validation errors
 * @param field - Field to check (e.g., "value[0]", "params[1]")
 * @returns True if the field has errors
 */
export function hasFieldError(
  errors: ElementError[] | undefined,
  field: string
): boolean {
  if (!errors || errors.length === 0) return false;
  return errors.some((error) => error.field === field);
}

/**
 * Gets all invalid IDs from validation errors
 * @param errors - Array of validation errors
 * @returns Set of invalid ID numbers
 */
export function getInvalidIds(
  errors: ElementError[] | undefined
): Set<number> {
  if (!errors || errors.length === 0) return new Set();
  
  const invalidIds = new Set<number>();
  errors.forEach((error) => {
    if (error.invalidId !== undefined) {
      invalidIds.add(error.invalidId);
    }
  });
  
  return invalidIds;
}

/**
 * Checks if a specific ID is invalid
 * @param errors - Array of validation errors
 * @param id - ID to check
 * @returns True if the ID is invalid
 */
export function isIdInvalid(
  errors: ElementError[] | undefined,
  id: number | string | null
): boolean {
  if (typeof id !== "number") return false;
  const invalidIds = getInvalidIds(errors);
  return invalidIds.has(id);
}

/**
 * Gets error class name for styling
 * @param hasError - Whether the field/ID has an error
 * @param baseClass - Base CSS class name
 * @returns CSS class name with error class if applicable
 */
export function getErrorClass(hasError: boolean, baseClass: string): string {
  return hasError ? `${baseClass} error` : baseClass;
}

/**
 * Gets validation errors for a specific invalid ID
 * @param errors - Array of validation errors
 * @param id - ID to get errors for
 * @returns Array of validation errors related to this ID
 */
export function getErrorsForId(
  errors: ElementError[] | undefined,
  id: number | string | null
): ElementError[] {
  if (!errors || errors.length === 0 || typeof id !== "number") return [];
  return errors.filter((error) => error.invalidId === id);
}
