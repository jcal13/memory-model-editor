/**
 * Error Structuring Utilities for Backend
 * 
 * Converts string error messages to structured FeedbackError format
 */

export enum ErrorType {
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  VALUE_MISMATCH = 'VALUE_MISMATCH',
  MISSING_ELEMENT = 'MISSING_ELEMENT',
  UNEXPECTED_ELEMENT = 'UNEXPECTED_ELEMENT',
  DUPLICATE_ID = 'DUPLICATE_ID',
  ORPHANED_ELEMENT = 'ORPHANED_ELEMENT',
  FRAME_MISMATCH = 'FRAME_MISMATCH',
  CALL_STACK_ORDER = 'CALL_STACK_ORDER',
  PROPERTY_MISMATCH = 'PROPERTY_MISMATCH',
  GENERIC_ERROR = 'GENERIC_ERROR',
  INVALID_REFERENCE = "INVALID_REFERENCE",
  UNREACHABLE_OBJECT = "UNREACHABLE_OBJECT",
  REFERENCE_MISMATCH = "REFERENCE_MISMATCH",
  DUPLICATE_NONE_OBJECT = "DUPLICATE_NONE_OBJECT",
}

export interface FeedbackError {
  type: ErrorType;
  message: string;
  title?: string;
  elementId?: number;
  field?: string;
  relatedIds?: number[];
  path?: string;
  severity?: 'error' | 'warning' | 'info';
}

function titleForError(type: ErrorType): string {
  switch (type) {
    case ErrorType.TYPE_MISMATCH:
      return "Type mismatch";
    case ErrorType.VALUE_MISMATCH:
      return "Value mismatch";
    case ErrorType.MISSING_ELEMENT:
      return "Missing element";
    case ErrorType.UNEXPECTED_ELEMENT:
      return "Unexpected element";
    case ErrorType.DUPLICATE_ID:
      return "Duplicate ID";
    case ErrorType.ORPHANED_ELEMENT:
      return "Orphaned element";
    case ErrorType.FRAME_MISMATCH:
      return "Function mismatch";
    case ErrorType.CALL_STACK_ORDER:
      return "Call stack order mismatch";
    case ErrorType.PROPERTY_MISMATCH:
      return "Property mismatch";
    case ErrorType.INVALID_REFERENCE:
      return "Invalid reference";
    case ErrorType.UNREACHABLE_OBJECT:
      return "Unreachable object";
    case ErrorType.REFERENCE_MISMATCH:
      return "Reference mismatch";
    case ErrorType.DUPLICATE_NONE_OBJECT:
      return "Duplicate None object";
    default:
      return "Error";
  }
}

function buildError(
  type: ErrorType,
  message: string,
  details: Omit<FeedbackError, "type" | "message" | "title"> = {}
): FeedbackError {
  return {
    type,
    title: titleForError(type),
    message,
    ...details,
  };
}

/**
 * Converts a string error message to a structured FeedbackError
 * @param message - Error message string
 * @returns Structured feedback error
 */
export function structureError(message: string): FeedbackError {
  // Pattern: "In name: variable "x" is missing"
  const inFrameMissingMatch = message.match(/^In (.+?): variable "(.+?)" is missing$/);
  if (inFrameMissingMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      path: `function "${inFrameMissingMatch[1]}" → var "${inFrameMissingMatch[2]}"`,
      field: inFrameMissingMatch[2],
      severity: 'error',
    });
  }

  // Pattern: "In name: variable "x" should not be present"
  const inFrameUnexpectedMatch = message.match(/^In (.+?): variable "(.+?)" should not be present$/);
  if (inFrameUnexpectedMatch) {
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      path: `function "${inFrameUnexpectedMatch[1]}" → var "${inFrameUnexpectedMatch[2]}"`,
      field: inFrameUnexpectedMatch[2],
      severity: 'error',
    });
  }

  // Pattern: "In name: variable "x" needs to be assigned to an object"
  const inFrameUnassignedMatch = message.match(/^In (.+?): variable "(.+?)" needs to be assigned/);
  if (inFrameUnassignedMatch) {
    return buildError(ErrorType.INVALID_REFERENCE, message, {
      path: `function "${inFrameUnassignedMatch[1]}" → var "${inFrameUnassignedMatch[2]}"`,
      field: inFrameUnassignedMatch[2],
      severity: 'error',
    });
  }

  // Pattern: "Variable "head" in __main__ is missing a valid reference"
  const invalidReferenceMatch = message.match(
    /^Variable "(.+?)" in (.+?) is missing a valid reference$/
  );
  if (invalidReferenceMatch) {
    return buildError(ErrorType.INVALID_REFERENCE, message, {
      path: `function "${invalidReferenceMatch[2]}" → var "${invalidReferenceMatch[1]}"`,
      field: invalidReferenceMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "This object is unreachable because no variable or attribute points to it"
  if (message.includes('unreachable because no variable or attribute points to it')) {
    return buildError(ErrorType.UNREACHABLE_OBJECT, message, {
      severity: 'error',
    });
  }

  // Pattern: "At X: expected Y, but got Z" (value or type mismatch)
  const atExpectedMatch = message.match(/^At (.+?): expected .+, but got .+$/);
  if (atExpectedMatch) {
    const pathPart = atExpectedMatch[1].trim();
    const gotPart = message.replace(/^At .+?:\s*expected .+,\s*but got\s+/, '');
    const looksLikeType = /^(int|float|str|bool|None|NoneType|list|dict|tuple|set|object)$/.test(gotPart.trim());

    return buildError(
      looksLikeType ? ErrorType.TYPE_MISMATCH : ErrorType.VALUE_MISMATCH,
      message,
      {
        path: pathPart,
        severity: 'error',
      }
    );
  }

  // Pattern: "Value mismatch: ..." (legacy)
  if (message.includes('Value mismatch')) {
    const pathMatch = message.match(/Value mismatch: (.+?)(?:,| got)/);
    return buildError(ErrorType.VALUE_MISMATCH, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "ID incorrectly or incompletely assigned at X"
  if (message.includes('ID incorrectly or incompletely assigned')) {
    const pathMatch = message.match(/ID incorrectly or incompletely assigned(?: at)?[:\s]*(.+)/);
    return buildError(ErrorType.TYPE_MISMATCH, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "Type mismatch: ..." (legacy)
  if (message.includes('Type mismatch')) {
    const pathMatch = message.match(/Type mismatch: (.+?) got/);
    return buildError(ErrorType.TYPE_MISMATCH, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "At X: Y is missing the "Z" attribute"
  if (message.includes('is missing the') && message.includes('attribute')) {
    const pathMatch = message.match(/^At (.+?):/);
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "At X: Y has an unexpected "Z" attribute"
  if (message.includes('has an unexpected') && message.includes('attribute')) {
    const pathMatch = message.match(/^At (.+?):/);
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "Unmapped ID: function "__main__" → var "b""
  if (message.includes('Unmapped ID')) {
    const pathMatch = message.match(/Unmapped ID: (.+)/);
    return buildError(ErrorType.ORPHANED_ELEMENT, message, {
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    });
  }

  // Pattern: "Missing element: path[0] id=5" or "Missing element: path id=5"
  const missingMatch = message.match(/Missing element: (.+?) id=(\d+)/i);
  if (missingMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      elementId: parseInt(missingMatch[2]),
      path: missingMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Unexpected element: path[0] id=7" or "Unexpected element: path id=7"
  const unexpectedMatch = message.match(/Unexpected element: (.+?) id=(\d+)/i);
  if (unexpectedMatch) {
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      elementId: parseInt(unexpectedMatch[2]),
      path: unexpectedMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Missing variable: frame.name.var_name id=4"
  const missingVarMatch = message.match(/Missing variable: (.+?) id=(\d+)/i);
  if (missingVarMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      elementId: parseInt(missingVarMatch[2]),
      path: missingVarMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Unexpected variable: frame.name.var_name id=8"
  const unexpectedVarMatch = message.match(/Unexpected variable: (.+?) id=(\d+)/i);
  if (unexpectedVarMatch) {
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      elementId: parseInt(unexpectedVarMatch[2]),
      path: unexpectedVarMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Duplicate ID: 5"
  const duplicateMatch = message.match(/Duplicate ID[:\s]+(\d+)/i);
  if (duplicateMatch) {
    return buildError(ErrorType.DUPLICATE_ID, message, {
      elementId: parseInt(duplicateMatch[1]),
      severity: 'error',
    });
  }

  // Pattern: "Unmapped box: id=4"
  const unmappedMatch = message.match(/Unmapped box: id=(\d+)/i);
  if (unmappedMatch) {
    return buildError(ErrorType.ORPHANED_ELEMENT, message, {
      elementId: parseInt(unmappedMatch[1]),
      severity: 'error',
    });
  }

  // Pattern: "Missing key: path key=name, id=4"
  const missingKeyMatch = message.match(/Missing key: (.+?) key=(.+?), id=(\d+)/i);
  if (missingKeyMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      elementId: parseInt(missingKeyMatch[3]),
      path: missingKeyMatch[1],
      field: missingKeyMatch[2],
      severity: 'error',
    });
  }

  // Pattern: "Unexpected key: path key=name, id=7"
  const unexpectedKeyMatch = message.match(/Unexpected key: (.+?) key=(.+?), id=(\d+)/i);
  if (unexpectedKeyMatch) {
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      elementId: parseInt(unexpectedKeyMatch[3]),
      path: unexpectedKeyMatch[1],
      field: unexpectedKeyMatch[2],
      severity: 'error',
    });
  }

  // Pattern: "Missing function: \"func_name\""
  const missingFuncMatch = message.match(/Missing function: "(.+?)"/i);
  if (missingFuncMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      path: missingFuncMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Unexpected function: \"func_name\""
  const unexpectedFuncMatch = message.match(/Unexpected function: "(.+?)"/i);
  if (unexpectedFuncMatch) {
    return buildError(ErrorType.UNEXPECTED_ELEMENT, message, {
      path: unexpectedFuncMatch[1],
      severity: 'error',
    });
  }

  // Pattern: "Missing variable: function \"name\" expected \"var\""
  const missingVarFuncMatch = message.match(/Missing variable: function "(.+?)" expected "(.+?)"/i);
  if (missingVarFuncMatch) {
    return buildError(ErrorType.MISSING_ELEMENT, message, {
      path: `${missingVarFuncMatch[1]}.${missingVarFuncMatch[2]}`,
      severity: 'error',
    });
  }

  // Pattern: "Orphaned element ID 8" or "Orphaned element: id=8"
  const orphanedMatch = message.match(/Orphan(?:ed)?.*?(?:ID[:\s]+|id=)(\d+)/i);
  if (orphanedMatch) {
    return buildError(ErrorType.ORPHANED_ELEMENT, message, {
      elementId: parseInt(orphanedMatch[1]),
      severity: 'warning',
    });
  }

  // Pattern: "Function count mismatch: expected 2, got 3"
  if (message.match(/function.*count.*mismatch/i)) {
    return buildError(ErrorType.FRAME_MISMATCH, message, {
      severity: 'error',
    });
  }

  // Pattern: "Call stack order mismatch"
  if (message.match(/call stack.*order/i)) {
    return buildError(ErrorType.CALL_STACK_ORDER, message, {
      severity: 'error',
    });
  }

  // Pattern: "Property 'x' mismatch in object at ID 5"
  const propertyMatch = message.match(/Property.*?mismatch.*?ID (\d+)/i);
  if (propertyMatch) {
    const propNameMatch = message.match(/Property ['"](.+?)['"]/);
    return buildError(ErrorType.PROPERTY_MISMATCH, message, {
      elementId: parseInt(propertyMatch[1]),
      field: propNameMatch ? propNameMatch[1] : undefined,
      severity: 'error',
    });
  }

  // Try to extract frame/path information
  const pathMatch = message.match(/at (.+?)(?:\s|$|\()/);

  // Generic fallback - try to extract any ID mentioned
  const genericIdMatch = message.match(/\bID[:\s]+(\d+)/i);

  return buildError(ErrorType.GENERIC_ERROR, message, {
    elementId: genericIdMatch ? parseInt(genericIdMatch[1]) : undefined,
    path: pathMatch ? pathMatch[1] : undefined,
    severity: 'error',
  });
}

/**
 * Converts an array of string error messages to structured FeedbackErrors
 * @param messages - Array of error message strings
 * @returns Array of structured feedback errors
 */
export function structureErrors(messages: string[]): FeedbackError[] {
  return messages.map(structureError);
}
