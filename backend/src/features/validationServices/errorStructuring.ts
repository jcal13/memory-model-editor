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
}

export interface FeedbackError {
  type: ErrorType;
  message: string;
  elementId?: number;
  field?: string;
  relatedIds?: number[];
  path?: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Converts a string error message to a structured FeedbackError
 * @param message - Error message string
 * @returns Structured feedback error
 */
export function structureError(message: string): FeedbackError {
  // Pattern: "Value mismatch: function "__main__" → var "a", var "a" got "x", expected "3""
  // OR: "Value mismatch: path got value, expected value"
  if (message.includes('Value mismatch')) {
    const pathMatch = message.match(/Value mismatch: (.+?)(?:,| got)/);
    return {
      type: ErrorType.VALUE_MISMATCH,
      message,
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    };
  }

  // Pattern: "Type mismatch: path got type, expected type"
  if (message.includes('Type mismatch')) {
    const pathMatch = message.match(/Type mismatch: (.+?) got/);
    return {
      type: ErrorType.TYPE_MISMATCH,
      message,
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    };
  }

  // Pattern: "Unmapped ID: function "__main__" → var "b""
  if (message.includes('Unmapped ID')) {
    const pathMatch = message.match(/Unmapped ID: (.+)/);
    return {
      type: ErrorType.ORPHANED_ELEMENT,
      message,
      path: pathMatch ? pathMatch[1].trim() : undefined,
      severity: 'error',
    };
  }

  // Pattern: "Missing element: path[0] id=5" or "Missing element: path id=5"
  const missingMatch = message.match(/Missing element: (.+?) id=(\d+)/i);
  if (missingMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      elementId: parseInt(missingMatch[2]),
      path: missingMatch[1],
      severity: 'error',
    };
  }

  // Pattern: "Unexpected element: path[0] id=7" or "Unexpected element: path id=7"
  const unexpectedMatch = message.match(/Unexpected element: (.+?) id=(\d+)/i);
  if (unexpectedMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      elementId: parseInt(unexpectedMatch[2]),
      path: unexpectedMatch[1],
      severity: 'error',
    };
  }

  // Pattern: "Missing variable: frame.name.var_name id=4"
  const missingVarMatch = message.match(/Missing variable: (.+?) id=(\d+)/i);
  if (missingVarMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      elementId: parseInt(missingVarMatch[2]),
      path: missingVarMatch[1],
      severity: 'error',
    };
  }

  // Pattern: "Unexpected variable: frame.name.var_name id=8"
  const unexpectedVarMatch = message.match(/Unexpected variable: (.+?) id=(\d+)/i);
  if (unexpectedVarMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      elementId: parseInt(unexpectedVarMatch[2]),
      path: unexpectedVarMatch[1],
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

  // Pattern: "Unmapped box: id=4"
  const unmappedMatch = message.match(/Unmapped box: id=(\d+)/i);
  if (unmappedMatch) {
    return {
      type: ErrorType.ORPHANED_ELEMENT,
      message,
      elementId: parseInt(unmappedMatch[1]),
      severity: 'error',
    };
  }

  // Pattern: "Missing key: path key=name, id=4"
  const missingKeyMatch = message.match(/Missing key: (.+?) key=(.+?), id=(\d+)/i);
  if (missingKeyMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      elementId: parseInt(missingKeyMatch[3]),
      path: missingKeyMatch[1],
      field: missingKeyMatch[2],
      severity: 'error',
    };
  }

  // Pattern: "Unexpected key: path key=name, id=7"
  const unexpectedKeyMatch = message.match(/Unexpected key: (.+?) key=(.+?), id=(\d+)/i);
  if (unexpectedKeyMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      elementId: parseInt(unexpectedKeyMatch[3]),
      path: unexpectedKeyMatch[1],
      field: unexpectedKeyMatch[2],
      severity: 'error',
    };
  }

  // Pattern: "Missing function: \"func_name\""
  const missingFuncMatch = message.match(/Missing function: "(.+?)"/i);
  if (missingFuncMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      path: missingFuncMatch[1],
      severity: 'error',
    };
  }

  // Pattern: "Unexpected function: \"func_name\""
  const unexpectedFuncMatch = message.match(/Unexpected function: "(.+?)"/i);
  if (unexpectedFuncMatch) {
    return {
      type: ErrorType.UNEXPECTED_ELEMENT,
      message,
      path: unexpectedFuncMatch[1],
      severity: 'error',
    };
  }

  // Pattern: "Missing variable: function \"name\" expected \"var\""
  const missingVarFuncMatch = message.match(/Missing variable: function "(.+?)" expected "(.+?)"/i);
  
  if (missingVarFuncMatch) {
    return {
      type: ErrorType.MISSING_ELEMENT,
      message,
      path: `${missingVarFuncMatch[1]}.${missingVarFuncMatch[2]}`,
      severity: 'error',
    };
  }

  // Pattern: "Orphaned element ID 8" or "Orphaned element: id=8"
  const orphanedMatch = message.match(/Orphan(?:ed)?.*?(?:ID[:\s]+|id=)(\d+)/i);
  if (orphanedMatch) {
    return {
      type: ErrorType.ORPHANED_ELEMENT,
      message,
      elementId: parseInt(orphanedMatch[1]),
      severity: 'warning',
    };
  }

  // Pattern: "Function count mismatch: expected 2, got 3"
  if (message.match(/function.*count.*mismatch/i)) {
    return {
      type: ErrorType.FRAME_MISMATCH,
      message,
      severity: 'error',
    };
  }

  // Pattern: "Call stack order mismatch"
  if (message.match(/call stack.*order/i)) {
    return {
      type: ErrorType.CALL_STACK_ORDER,
      message,
      severity: 'error',
    };
  }

  // Pattern: "Property 'x' mismatch in object at ID 5"
  const propertyMatch = message.match(/Property.*?mismatch.*?ID (\d+)/i);
  if (propertyMatch) {
    const propNameMatch = message.match(/Property ['"](.+?)['"]/);
    return {
      type: ErrorType.PROPERTY_MISMATCH,
      message,
      elementId: parseInt(propertyMatch[1]),
      field: propNameMatch ? propNameMatch[1] : undefined,
      severity: 'error',
    };
  }

  // Try to extract frame/path information
  const pathMatch = message.match(/at (.+?)(?:\s|$|\()/);
  
  // Generic fallback - try to extract any ID mentioned
  const genericIdMatch = message.match(/\bID[:\s]+(\d+)/i);
  
  return {
    type: ErrorType.GENERIC_ERROR,
    message,
    elementId: genericIdMatch ? parseInt(genericIdMatch[1]) : undefined,
    path: pathMatch ? pathMatch[1] : undefined,
    severity: 'error',
  };
}

/**
 * Converts an array of string error messages to structured FeedbackErrors
 * @param messages - Array of error message strings
 * @returns Array of structured feedback errors
 */
export function structureErrors(messages: string[]): FeedbackError[] {
  return messages.map(structureError);
}
