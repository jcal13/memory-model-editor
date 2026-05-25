/**
 * Error Message Templates
 *
 * All user-facing error messages are defined here as functions.
 * To customize any message, edit the corresponding function below.
 */

export const ERROR_MESSAGES = {

  // ID / pointer errors

  // Pattern: "Variable a and variable b cannot point to the same object"
  id_mapping_conflict: (pathA: string, pathB: string) =>
    `Variable ${pathA} and variable ${pathB} cannot point to the same object`,

  // Pattern: "Variable "b" in __main__ is pointing to an object that doesn't exist"
  unmapped_variable: (varName: string, frameName: string) =>
    `Variable "${varName}" in ${frameName} is pointing to an object that doesn't exist`,

  // Pattern: "Unmapped ID: function "__main__" → var "b"" (fallback for non-variable paths)
  unmapped_id_fallback: (cleanPath: string) =>
    `Unmapped ID: ${cleanPath}`,

  // Pattern: "Two objects share the same ID. Each object must have a unique ID."
  duplicate_id: () =>
    `Two objects share the same ID. Each object must have a unique ID.`,

  // Type / value errors

  // Pattern: "At a: expected int, but got str"
  type_mismatch: (loc: string, expectedType: string, gotType: string) =>
    `At ${loc}: expected ${expectedType}, but got ${gotType}`,

  // Pattern: "At a: object is incorrectly or incompletely connected"
  object_incorrectly_connected: (loc: string) =>
    `At ${loc}: object is incorrectly or incompletely connected`,

  // Pattern: "At a: expected 5, but got 3"
  value_mismatch: (loc: string, expected: string, got: string) =>
    `At ${loc}: expected ${expected}, but got ${got}`,

  // Array / list / tuple errors

  // Pattern: "Missing element: list[0] id=5"
  missing_element_at_index: (path: string, index: number, id: number) =>
    `Missing element: ${path}[${index}] id=${id}`,

  // Pattern: "Unexpected element: list[0] id=7"
  unexpected_element_at_index: (path: string, index: number, id: number) =>
    `Unexpected element: ${path}[${index}] id=${id}`,

  // Set errors

  // Pattern: "Missing element: set id=5"
  missing_element_in_set: (path: string, id: number) =>
    `Missing element: ${path} id=${id}`,

  // Pattern: "Unexpected element: set id=7"
  unexpected_element_in_set: (path: string, id: number) =>
    `Unexpected element: ${path} id=${id}`,

  // Dictionary errors

  // Pattern: "Missing key: dict key=name, id=4"
  missing_dict_key: (path: string, key: string, id: number) =>
    `Missing key: ${path} key=${key}, id=${id}`,

  // Pattern: "Unexpected key: dict key=name, id=7"
  unexpected_dict_key: (path: string, key: string, id: number) =>
    `Unexpected key: ${path} key=${key}, id=${id}`,

  // Object / class instance errors

  // Pattern: "At a: expected Dog object, but got Cat"
  object_name_mismatch: (loc: string, expected: string, got: string) =>
    `At ${loc}: expected ${expected} object, but got ${got}`,

  // Pattern: "At a: Dog is missing the "name" attribute"
  missing_attribute: (loc: string, objectName: string, prop: string) =>
    `At ${loc}: ${objectName} is missing the "${prop}" attribute`,

  // Pattern: "At a: Dog has an unexpected "name" attribute"
  unexpected_attribute: (loc: string, objectName: string, prop: string) =>
    `At ${loc}: ${objectName} has an unexpected "${prop}" attribute`,

  // Call stack / frame errors

  // Pattern: "Call stack should have 2 function(s), but has 3"
  call_stack_count: (expected: number, got: number) =>
    `Call stack should have ${expected} function(s), but has ${got}`,

  // Pattern: "Call stack is missing the foo function"
  missing_function: (name: string) =>
    `Call stack is missing the ${name} function`,

  // Pattern: "Call stack should have 2 foo function(s), but has 1"
  function_count_mismatch: (count: number, name: string, inputCount: number) =>
    `Call stack should have ${count} ${name} function(s), but has ${inputCount}`,

  // Pattern: "Call stack has an unexpected foo function"
  unexpected_function: (name: string) =>
    `Call stack has an unexpected ${name} function`,

  // Pattern: "Call stack functions are in the wrong order"
  call_stack_order: () =>
    `Call stack functions are in the wrong order`,

  // Variable errors (inside frames)

  // Pattern: "In __main__: variable "a" is missing"
  variable_missing: (name: string, varName: string) =>
    `In ${name}: variable "${varName}" is missing`,

  // Pattern: "In __main__: variable "a" should not be present"
  variable_unexpected: (name: string, varName: string) =>
    `In ${name}: variable "${varName}" should not be present`,

  // Pattern: "In __main__: variable "a" needs to be assigned to an object"
  variable_unassigned: (name: string, varName: string) =>
    `In ${name}: variable "${varName}" needs to be assigned to an object`,

  // Orphan / floating object errors

  // Pattern: "Missing object: expected a free-floating int with value 5"
  missing_unattached_object: (type: string, value: unknown) =>
    `Missing object: expected a free-floating ${type} with value ${value}`,

  // Pattern: "Unexpected object: this object should not be on the canvas"
  unexpected_unattached_object: () =>
    `Unexpected object: this object should not be on the canvas`,

  // System / question errors

  // Pattern: "Invalid question id: 5"
  invalid_question_id: (id: number) =>
    `Invalid question id: ${id}`,

  // Pattern: "No answer defined for line 5" or "No answer defined for line 5 iteration 2"
  no_answer_for_line: (lineNumber: number, iterationNumber?: number) =>
    `No answer defined for line ${lineNumber}${iterationNumber !== undefined ? ` iteration ${iterationNumber}` : ""}`,

};
