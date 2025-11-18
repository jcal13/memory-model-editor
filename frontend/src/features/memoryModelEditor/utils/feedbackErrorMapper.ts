/**
 * Feedback Error Mapper
 * 
 * Maps backend feedback errors to frontend ElementErrors and attaches them
 * to the appropriate canvas elements.
 */

import { CanvasElement, FeedbackError, ElementError, ErrorSource, ErrorType } from "../../shared/types";

/**
 * Applies feedback errors to canvas elements
 * @param elements - Current canvas elements
 * @param feedbackErrors - Errors from backend submission
 * @returns Elements with feedback errors attached
 */
export function applyFeedbackErrors(
  elements: CanvasElement[],
  feedbackErrors: FeedbackError[]
): CanvasElement[] {
  console.log('[feedbackErrorMapper] Applying errors. Elements:', elements.length, 'Feedback errors:', feedbackErrors.length);
  console.log('[feedbackErrorMapper] Feedback errors:', feedbackErrors);
  
  // Create maps for quick lookup
  const elementsByIdMap = new Map<number | "_", CanvasElement[]>();
  const framesByNameMap = new Map<string, CanvasElement>();
  
  elements.forEach((element) => {
    // Map by ID
    const existing = elementsByIdMap.get(element.id) || [];
    existing.push(element);
    elementsByIdMap.set(element.id, existing);
    
    // Map function frames by name
    if (element.kind.name === "function") {
      framesByNameMap.set(element.kind.functionName, element);
    }
  });

  console.log('[feedbackErrorMapper] Element IDs:', Array.from(elementsByIdMap.keys()));
  console.log('[feedbackErrorMapper] Frame names:', Array.from(framesByNameMap.keys()));

  // Group feedback errors by element
  const errorsByElement = new Map<CanvasElement, FeedbackError[]>();
  const unmappedErrors: FeedbackError[] = [];
  
  feedbackErrors.forEach((feedbackError) => {
    let targetElement: CanvasElement | undefined;
    
    // Special handling for ID mapping conflicts
    // These errors should highlight the FRAME where the conflicting variables are defined
    // NOT the object they point to, because the fix happens in the frame
    const isIdMappingConflict = feedbackError.type === ErrorType.GENERIC_ERROR && 
                                 feedbackError.message?.includes('ID mapping conflict');
    
    if (isIdMappingConflict && feedbackError.path) {
      // For ID mapping conflicts, always highlight the frame, not the variable's target
      const functionMatch = feedbackError.path.match(/function\s+"([^"]+)"/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        targetElement = framesByNameMap.get(functionName);
        console.log('[feedbackErrorMapper] ID mapping conflict - mapped to frame:', functionName, 'found:', !!targetElement);
      }
    }
    
    // Strategy 1: Use elementId if provided (only if not already mapped above)
    if (!targetElement && feedbackError.elementId !== undefined) {
      const elementsWithId = elementsByIdMap.get(feedbackError.elementId);
      targetElement = elementsWithId?.[0];
      console.log('[feedbackErrorMapper] Mapped error to elementId:', feedbackError.elementId, 'found:', !!targetElement);
    }
    
    // Strategy 2: Parse path to find the most specific element
    if (!targetElement && feedbackError.path) {
      // Priority 1: Look for variable references in path like 'function "__main__" → var "c"'
      // This tells us which variable (and thus which canvas element) has the issue
      const varMatch = feedbackError.path.match(/→\s*var\s+"([^"]+)"/);
      if (varMatch) {
        const varName = varMatch[1];
        // Find function frame first
        const functionMatch = feedbackError.path.match(/function\s+"([^"]+)"/);
        if (functionMatch) {
          const functionName = functionMatch[1];
          const frame = framesByNameMap.get(functionName);
          if (frame && frame.kind.name === 'function') {
            // Find the parameter/variable with this name
            const param = frame.kind.params.find(p => p.name === varName);
            if (param && param.targetId !== null) {
              const elementsWithId = elementsByIdMap.get(param.targetId);
              targetElement = elementsWithId?.[0];
              console.log('[feedbackErrorMapper] Mapped error to variable:', varName, 'ID:', param.targetId, 'found:', !!targetElement);
            }
          }
        }
      }
      
      // Priority 2: Extract function name from path if no variable found
      if (!targetElement) {
        const functionMatch = feedbackError.path.match(/function\s+"([^"]+)"/);
        if (functionMatch) {
          const functionName = functionMatch[1];
          targetElement = framesByNameMap.get(functionName);
          console.log('[feedbackErrorMapper] Mapped error to frame:', functionName, 'found:', !!targetElement);
        }
      }
    }
    
    if (targetElement) {
      const existing = errorsByElement.get(targetElement) || [];
      existing.push(feedbackError);
      errorsByElement.set(targetElement, existing);
    } else {
      console.log('[feedbackErrorMapper] Could not map error:', feedbackError);
      unmappedErrors.push(feedbackError);
    }
  });

  console.log('[feedbackErrorMapper] Errors mapped to elements:', errorsByElement.size);
  console.log('[feedbackErrorMapper] Unmapped errors:', unmappedErrors.length);

  // Apply feedback errors to elements
  const updatedElements = elements.map((element) => {
    const feedbackErrorsForElement = errorsByElement.get(element) || [];
    
    if (feedbackErrorsForElement.length === 0) {
      return element; // No feedback errors for this element
    }

    console.log('[feedbackErrorMapper] Attaching', feedbackErrorsForElement.length, 'errors to element', element.id, element.kind.name === 'function' ? `(${element.kind.functionName})` : '');
    
    // Convert feedback errors to ElementErrors
    const mappedErrors: ElementError[] = feedbackErrorsForElement.map((feedbackError) => ({
      source: ErrorSource.FEEDBACK,
      type: feedbackError.type,
      message: feedbackError.message,
      field: feedbackError.field,
      invalidId: undefined,
      severity: feedbackError.severity || 'error',
    }));

    // Merge with existing errors (validation errors)
    const existingErrors = element.errors || [];
    
    // Filter out old feedback errors and keep validation errors
    const validationErrors = existingErrors.filter(
      (err) => err.source === ErrorSource.VALIDATION
    );

    return {
      ...element,
      errors: [...validationErrors, ...mappedErrors],
    };
  });

  // Handle unmapped errors - attach to first frame or first element as last resort
  if (unmappedErrors.length > 0 && updatedElements.length > 0) {
    console.log('[feedbackErrorMapper] Attaching', unmappedErrors.length, 'unmapped errors to fallback element');
    
    // Try to find __main__ frame first, then any frame, then first element
    let fallbackElement = updatedElements.find(el => 
      el.kind.name === 'function' && el.kind.functionName === '__main__'
    ) || updatedElements.find(el => el.kind.name === 'function') || updatedElements[0];
    
    const fallbackIndex = updatedElements.indexOf(fallbackElement);
    const unmappedMappedErrors: ElementError[] = unmappedErrors.map((feedbackError) => ({
      source: ErrorSource.FEEDBACK,
      type: feedbackError.type,
      message: feedbackError.message,
      field: feedbackError.field,
      invalidId: undefined,
      severity: feedbackError.severity || 'error',
    }));
    
    updatedElements[fallbackIndex] = {
      ...fallbackElement,
      errors: [...(fallbackElement.errors || []), ...unmappedMappedErrors],
    };
  }

  return updatedElements;
}

/**
 * Clears all feedback errors from elements (keeps validation errors)
 * @param elements - Canvas elements
 * @returns Elements with only validation errors
 */
export function clearFeedbackErrors(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((element) => {
    if (!element.errors) {
      return element;
    }

    const validationErrors = element.errors.filter(
      (err) => err.source === ErrorSource.VALIDATION
    );

    return {
      ...element,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    };
  });
}

/**
 * Parses backend error messages to extract element IDs and create structured errors
 * @param errorMessages - Array of error strings from backend
 * @returns Array of structured feedback errors
 */
export function parseBackendErrors(errorMessages: string[]): FeedbackError[] {
  const feedbackErrors: FeedbackError[] = [];

  errorMessages.forEach((message) => {
    const error = parseErrorMessage(message);
    feedbackErrors.push(error);
  });

  return feedbackErrors;
}

/**
 * Parses a single error message to extract structured information
 * @param message - Error message string
 * @returns Structured feedback error
 */
function parseErrorMessage(message: string): FeedbackError {
  // Pattern: "Type mismatch at ID 5: expected list, got dict"
  const typeMismatchMatch = message.match(/Type mismatch.*?ID (\d+)/i);
  if (typeMismatchMatch) {
    return {
      type: ErrorType.TYPE_MISMATCH,
      message,
      elementId: parseInt(typeMismatchMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Value mismatch at ID 3[0]: expected 10, got 20"
  const valueMismatchMatch = message.match(/Value mismatch.*?ID (\d+)/i);
  if (valueMismatchMatch) {
    return {
      type: ErrorType.VALUE_MISMATCH,
      message,
      elementId: parseInt(valueMismatchMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Missing element at frame.main > var.x (ID 4)"
  const missingMatch = message.match(/Missing.*?ID (\d+)/i);
  if (missingMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      elementId: parseInt(missingMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Unexpected element at frame.main > var.y (ID 7)"
  const unexpectedMatch = message.match(/Unexpected.*?ID (\d+)/i);
  if (unexpectedMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      elementId: parseInt(unexpectedMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Duplicate ID: 5"
  const duplicateMatch = message.match(/Duplicate ID[:\s]+(\d+)/i);
  if (duplicateMatch) {
    return {
      type: ErrorType.DUPLICATE_ID,
      message,
      elementId: parseInt(duplicateMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Orphaned element ID 8"
  const orphanedMatch = message.match(/Orphaned.*?ID[:\s]+(\d+)/i);
  if (orphanedMatch) {
    return {
      type: ErrorType.ORPHANED_ELEMENT,
      message,
      elementId: parseInt(orphanedMatch[1]),
      severity: 'warning',
    };
  }

  // Pattern: "Function count mismatch" or frame-related errors
  if (message.match(/function|frame|call stack/i)) {
    return {
      type: ErrorType.FRAME_MISMATCH,
      message,
      severity: 'error',
    };
  }

  // Generic fallback - try to extract any ID mentioned
  const genericIdMatch = message.match(/\bID[:\s]+(\d+)/i);
  if (genericIdMatch) {
    return {
      type: ErrorType.GENERIC_ERROR,
      message,
      elementId: parseInt(genericIdMatch[1]),
      severity: 'error',
    };
  }

  // No ID found - generic error
  return {
    type: ErrorType.GENERIC_ERROR,
    message,
    severity: 'error',
  };
}
