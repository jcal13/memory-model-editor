/**
 * Feedback Error Mapper
 *
 * Maps backend feedback errors to frontend ElementErrors and attaches them
 * to the appropriate canvas elements.
 */

import {
  CanvasElement,
  FeedbackError,
  ElementError,
  ErrorSource,
  ErrorType,
} from "../../shared/types";

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
  console.log(
    "[feedbackErrorMapper] Applying errors. Elements:",
    elements.length,
    "Feedback errors:",
    feedbackErrors.length
  );
  console.log("[feedbackErrorMapper] Feedback errors:", feedbackErrors);

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

  console.log(
    "[feedbackErrorMapper] Element IDs:",
    Array.from(elementsByIdMap.keys())
  );
  console.log(
    "[feedbackErrorMapper] Frame names:",
    Array.from(framesByNameMap.keys())
  );

  // Group feedback errors by element
  const errorsByElement = new Map<CanvasElement, FeedbackError[]>();
  const unmappedErrors: FeedbackError[] = [];

  feedbackErrors.forEach((feedbackError) => {
    const relatedElementIds: (number | "_")[] = [];

    // Extract ALL element IDs involved in the error chain from the path
    if (feedbackError.path) {
      // Step 1: Extract frame from path (if present)
      const functionMatch = feedbackError.path.match(/function\s+"([^"]+)"/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const frame = framesByNameMap.get(functionName);
        if (frame) {
          relatedElementIds.push(frame.id);
          console.log(
            "[feedbackErrorMapper] Added frame to error chain:",
            functionName,
            "ID:",
            frame.id
          );
        }
      }

      // Note: We don't extract variable targets from path anymore because:
      // 1. For nested containers (e.g., L[0][1]), extracting variable "L" would include
      //    the wrong container (outer list instead of inner list)
      // 2. The backend already provides the correct elementId (direct container)
      // 3. This prevents highlighting unrelated elements with same variable name
    }

    // Step 3: Add primary elementId if provided and not already included
    if (
      feedbackError.elementId !== undefined &&
      !relatedElementIds.includes(feedbackError.elementId)
    ) {
      relatedElementIds.push(feedbackError.elementId);
      console.log(
        "[feedbackErrorMapper] Added primary element to error chain:",
        feedbackError.elementId
      );
    }

    // Step 4: Add any relatedIds if provided by backend
    if (feedbackError.relatedIds) {
      feedbackError.relatedIds.forEach((relatedId) => {
        if (!relatedElementIds.includes(relatedId)) {
          relatedElementIds.push(relatedId);
          console.log(
            "[feedbackErrorMapper] Added backend relatedId to error chain:",
            relatedId
          );
        }
      });
    }

    // Find the primary element to attach this error to (first element in the chain)
    let primaryElement: CanvasElement | undefined;
    for (const elementId of relatedElementIds) {
      const elementsWithId = elementsByIdMap.get(elementId);
      if (elementsWithId && elementsWithId[0]) {
        primaryElement = elementsWithId[0];
        break;
      }
    }

    if (primaryElement && relatedElementIds.length > 0) {
      // Create ElementError with all related element IDs
      const elementError: ElementError = {
        source: ErrorSource.FEEDBACK,
        type: feedbackError.type,
        message: feedbackError.message,
        field: feedbackError.field,
        relatedElementIds: relatedElementIds,
        severity: feedbackError.severity || "error",
      };

      const existing = errorsByElement.get(primaryElement) || [];
      existing.push(feedbackError);
      errorsByElement.set(primaryElement, existing);
      console.log(
        "[feedbackErrorMapper] Attached error to primary element:",
        primaryElement.id,
        "with",
        relatedElementIds.length,
        "related elements"
      );
    } else {
      console.log("[feedbackErrorMapper] Could not map error:", feedbackError);
      unmappedErrors.push(feedbackError);
    }
  });

  console.log(
    "[feedbackErrorMapper] Errors mapped to elements:",
    errorsByElement.size
  );
  console.log("[feedbackErrorMapper] Unmapped errors:", unmappedErrors.length);

  // Apply feedback errors to elements
  const updatedElements = elements.map((element) => {
    const feedbackErrorsForElement = errorsByElement.get(element) || [];

    if (feedbackErrorsForElement.length === 0) {
      return element; // No feedback errors for this element
    }

    console.log(
      "[feedbackErrorMapper] Attaching",
      feedbackErrorsForElement.length,
      "errors to primary element",
      element.id,
      element.kind.name === "function" ? `(${element.kind.functionName})` : ""
    );

    // Convert feedback errors to ElementErrors with relatedElementIds
    const mappedErrors: ElementError[] = feedbackErrorsForElement.map(
      (feedbackError) => {
        // Extract all related element IDs from the path and backend fields
        const relatedIds: (number | "_")[] = [];

        if (feedbackError.path) {
          // Get frame ID from path
          const functionMatch =
            feedbackError.path.match(/function\s+"([^"]+)"/);
          if (functionMatch) {
            const frame = framesByNameMap.get(functionMatch[1]);
            if (frame) relatedIds.push(frame.id);
          }
        }

        // Add primary elementId (the direct container provided by backend)
        if (
          feedbackError.elementId !== undefined &&
          !relatedIds.includes(feedbackError.elementId)
        ) {
          relatedIds.push(feedbackError.elementId);
        }

        // Add backend-provided relatedIds (e.g., the primitive element being compared)
        if (feedbackError.relatedIds) {
          feedbackError.relatedIds.forEach((id) => {
            if (!relatedIds.includes(id)) relatedIds.push(id);
          });
        }

        return {
          source: ErrorSource.FEEDBACK,
          type: feedbackError.type,
          message: feedbackError.message,
          field: feedbackError.field,
          relatedElementIds: relatedIds.length > 0 ? relatedIds : undefined,
          severity: feedbackError.severity || "error",
        };
      }
    );

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
    console.log(
      "[feedbackErrorMapper] Attaching",
      unmappedErrors.length,
      "unmapped errors to fallback element"
    );

    // Try to find __main__ frame first, then any frame, then first element
    let fallbackElement =
      updatedElements.find(
        (el) =>
          el.kind.name === "function" && el.kind.functionName === "__main__"
      ) ||
      updatedElements.find((el) => el.kind.name === "function") ||
      updatedElements[0];

    const fallbackIndex = updatedElements.indexOf(fallbackElement);
    const unmappedMappedErrors: ElementError[] = unmappedErrors.map(
      (feedbackError) => ({
        source: ErrorSource.FEEDBACK,
        type: feedbackError.type,
        message: feedbackError.message,
        field: feedbackError.field,
        severity: feedbackError.severity || "error",
      })
    );

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
export function clearFeedbackErrors(
  elements: CanvasElement[]
): CanvasElement[] {
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
      severity: "error",
    };
  }

  // Pattern: "Value mismatch at ID 3[0]: expected 10, got 20"
  const valueMismatchMatch = message.match(/Value mismatch.*?ID (\d+)/i);
  if (valueMismatchMatch) {
    return {
      type: ErrorType.VALUE_MISMATCH,
      message,
      elementId: parseInt(valueMismatchMatch[1]),
      severity: "error",
    };
  }

  // Pattern: "Missing element at frame.main > var.x (ID 4)"
  const missingMatch = message.match(/Missing.*?ID (\d+)/i);
  if (missingMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      elementId: parseInt(missingMatch[1]),
      severity: "error",
    };
  }

  // Pattern: "Unexpected element at frame.main > var.y (ID 7)"
  const unexpectedMatch = message.match(/Unexpected.*?ID (\d+)/i);
  if (unexpectedMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      elementId: parseInt(unexpectedMatch[1]),
      severity: "error",
    };
  }

  // Pattern: "Duplicate ID: 5"
  const duplicateMatch = message.match(/Duplicate ID[:\s]+(\d+)/i);
  if (duplicateMatch) {
    return {
      type: ErrorType.DUPLICATE_ID,
      message,
      elementId: parseInt(duplicateMatch[1]),
      severity: "error",
    };
  }

  // Pattern: "Orphaned element ID 8"
  const orphanedMatch = message.match(/Orphaned.*?ID[:\s]+(\d+)/i);
  if (orphanedMatch) {
    return {
      type: ErrorType.ORPHANED_ELEMENT,
      message,
      elementId: parseInt(orphanedMatch[1]),
      severity: "warning",
    };
  }

  // Pattern: "Function count mismatch" or frame-related errors
  if (message.match(/function|frame|call stack/i)) {
    return {
      type: ErrorType.FRAME_MISMATCH,
      message,
      severity: "error",
    };
  }

  // Generic fallback - try to extract any ID mentioned
  const genericIdMatch = message.match(/\bID[:\s]+(\d+)/i);
  if (genericIdMatch) {
    return {
      type: ErrorType.GENERIC_ERROR,
      message,
      elementId: parseInt(genericIdMatch[1]),
      severity: "error",
    };
  }

  // No ID found - generic error
  return {
    type: ErrorType.GENERIC_ERROR,
    message,
    severity: "error",
  };
}
