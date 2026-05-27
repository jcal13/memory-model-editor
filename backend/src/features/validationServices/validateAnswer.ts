import { Pool } from "pg";
import { FeedbackError, ErrorType } from "./errorStructuring";
import { ERROR_MESSAGES } from "./errorMessages";

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    const cs = process.env.DATABASE_URL;
    if (!cs) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool!;
}

/* ---------- types ---------- */
export type MemoryBox = {
  type: string;
  id: number | null;
  value: any;
  name?: string;
  order?: number;
};

// Assign concise titles to validation errors for the feedback panel.
function getErrorTitle(type: ErrorType): string {
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
      return "Unreachable object";
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
    default:
      return "Error";
  }
}

// Build feedback errors in one place so titles stay consistent with messages.
function makeFeedbackError(
  type: ErrorType,
  message: string,
  details: Omit<FeedbackError, "type" | "message"> = {}
): FeedbackError {
  return {
    type,
    title: details.title ?? getErrorTitle(type),
    message,
    ...details,
  };
}

/* ---------- helpers ---------- */
const isArrayType = (t: string) => ["list", "tuple"].includes(t);
const isSetType = (t: string) => t === "set";
const isDictType = (t: string) => t === "dict";
const isObjectType = (t: string) => t === "object";
const isContainer = (t: string) =>
  isArrayType(t) || isSetType(t) || isDictType(t) || isClassInstanceType(t);

// Extract all element IDs involved in an error path for multi-element highlighting
function extractPathElementIds(
  path: string,
  inputMap: Map<number, MemoryBox>,
  framesByName: Map<string, MemoryBox>,
  primaryElementId?: number
): number[] {
  const ids: number[] = [];
  
  // Add primary element ID if provided
  if (primaryElementId !== undefined && primaryElementId !== null) {
    ids.push(primaryElementId);
  }
  
  // Extract frame from path: function "__main__"
  const frameMatch = path.match(/function\s+"([^"]+)"/);
  if (frameMatch) {
    const frameName = frameMatch[1];
    const frame = framesByName.get(frameName);
    if (frame && frame.id !== null) {
      ids.push(frame.id);
    }
  }
  
  return ids;
}

// Given an array of MemoryBox's, construct a map of ID: MemoryBox
// Drops boxes with no ID
const idMap = (m: MemoryBox[]) =>
  new Map(m.filter((e) => e.id !== null).map((e) => [e.id as number, e]));

// Ensure a bijection between answer and input IDs
function ensureBijection(
  answerID: number,
  inputID: number,
  answerToInputMap: Map<number, { target: number; path: string }>,
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  isVar: boolean,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  // check if the answer ID is already mapped to an input ID
  if (answerToInputMap.has(answerID)) {
    const prev = answerToInputMap.get(answerID)!;
    if (prev.target !== inputID) {
      if (!isVar) errors.push({
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.id_mapping_conflict(formatPathForUser(prev.path), formatPathForUser(path)),
        elementId: contextFrameId ?? inputID, // Use frame ID if available, otherwise the conflicting object
        path,
        severity: 'error'
      });
      return true;
    }
  }

  // check if the input ID is already mapped to an answer ID
  if (inputToAnswerMap.has(inputID)) {
    const prev = inputToAnswerMap.get(inputID)!;
    if (prev.target !== answerID) {
      if (!isVar) errors.push({
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.id_mapping_conflict(formatPathForUser(prev.path), formatPathForUser(path)),
        elementId: contextFrameId ?? inputID, // Use frame ID if available, otherwise the conflicting object
        path,
        severity: 'error'
      });
      return true;
    }
  }

  answerToInputMap.set(answerID, { target: inputID, path });
  inputToAnswerMap.set(inputID, { target: answerID, path });
  return false;
}

// .class (answer format) and object (frontend format) both represent class instances
const isClassInstanceType = (t: string) => t === ".class" || t === "object";

// None and NoneType are the same (Python representation)
const isNoneType = (t: string) => t === "None" || t === "NoneType";

// Values that represent None/null
const isNoneValue = (v: unknown) => v === null || v === "None" || v === "null";

// Converts technical path to a shorter, user-friendly description
function formatPathForUser(path: string): string {
  let s = path
    .replace(/function\s+"[^"]*"\s*→\s*var\s+"([^"]+)"→/g, "$1: ")
    .replace(/object\s+"([^"]+)"\.([^→]+)→/g, "$1.$2 → ");
  return s.replace(/\s*→\s*$/, "").trim() || path;
}

// Map backend/internal types to user-friendly names
const TYPE_FOR_USER: Record<string, string> = {
  ".frame": "function",
  ".class": "object",
  "NoneType": "NoneType",
  "None": "NoneType",
  "object": "object",
  "int": "int",
  "float": "float",
  "str": "string",
  "bool": "bool",
  "list": "list",
  "tuple": "tuple",
  "set": "set",
  "dict": "dictionary",
};

function formatTypeForUser(t: string): string {
  return TYPE_FOR_USER[t] ?? t;
}

// Check if the type of the answer box matches the input box
function checkTypeMismatch(
  answerBox: MemoryBox,
  inputBox: MemoryBox,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  if (answerBox.type === inputBox.type) return false;
  // Treat .class and object as equivalent (class instances)
  if (isClassInstanceType(answerBox.type) && isClassInstanceType(inputBox.type)) return false;
  // None and NoneType are the same
  if (isNoneType(answerBox.type) && isNoneType(inputBox.type)) return false;
  // For class instances: wrong type means ID is assigned incorrectly/incompletely, not a type error
  const loc = formatPathForUser(path);
  const message = isClassInstanceType(answerBox.type)
    ? ERROR_MESSAGES.object_incorrectly_connected(loc)
    : ERROR_MESSAGES.type_mismatch(loc, formatTypeForUser(answerBox.type), formatTypeForUser(inputBox.type));
  errors.push({
    type: ErrorType.TYPE_MISMATCH,
    message,
    elementId: contextFrameId ?? inputBox.id ?? undefined,
    relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
    path,
    severity: 'error'
  });
  return true;
}

// Check if the answer box is a primitive type and compare values
function comparePrimitives(
  answerBox: MemoryBox,
  inputBox: MemoryBox,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  // Object/class types use structure comparison (checkObject), not value comparison
  if (isClassInstanceType(answerBox.type)) return false;
  if (!isContainer(answerBox.type)) {
    const ansVal = answerBox.value;
    const inpVal = inputBox.value;
    const valuesMatch =
      ansVal === inpVal ||
      (isNoneType(answerBox.type) && isNoneValue(inpVal)) ||
      (isNoneType(inputBox.type) && isNoneValue(ansVal));
    if (!valuesMatch) {
      const loc = formatPathForUser(path);
      const expectedStr = isNoneValue(ansVal) ? "None" : String(ansVal);
      const gotStr = isNoneValue(inpVal) ? "None" : String(inpVal);
      errors.push({
        type: ErrorType.VALUE_MISMATCH,
        message: ERROR_MESSAGES.value_mismatch(loc, expectedStr, gotStr),
        elementId: contextFrameId ?? inputBox.id ?? undefined,
        relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
        path,
        severity: 'error'
      });
    }
    return true;
  }
  return false;
}

// Check if the answer box is an array and compare elements recursively
function checkArray(
  answerMemoryBox: MemoryBox,
  inputMemoryBox: MemoryBox,
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  answerToInputMap: Map<number, { target: number; path: string }>,
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  duplicates: Set<number>,
  path: string,
  errors: FeedbackError[],
  visited: Map<number, Set<number>>
) {
  // first check if the lengths match
  const expectedLen = answerMemoryBox.value.length;
  const actualLen = inputMemoryBox.value.length;

  // report exact missing / unexpected elements
  if (actualLen < expectedLen)
    for (let i = actualLen; i < expectedLen; i++)
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: ERROR_MESSAGES.missing_element_at_index(path, i, answerMemoryBox.value[i]),
        elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
        path: `${path}[${i}]`,
        severity: 'error'
      });

  if (actualLen > expectedLen)
    for (let j = expectedLen; j < actualLen; j++)
      errors.push(
        makeFeedbackError(
          ErrorType.UNEXPECTED_ELEMENT,
          ERROR_MESSAGES.unexpected_element_at_index(path, j, inputMemoryBox.value[j]),
          {
            elementId: inputMemoryBox.id ?? undefined,
            path: `${path}[${j}]`,
            severity: 'error',
          }
        )
      );

  // next, we compare each element 1:1 recursively; we do it this way because order matters
  const minLen = Math.min(expectedLen, actualLen);
  for (let i = 0; i < minLen; i++) {
    compareIds(
      answerMemoryBox.value[i],
      inputMemoryBox.value[i],
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      `${path}[${i}]→`,
      errors,
      visited,
      inputMemoryBox.id ?? undefined // Pass the container ID as context
    );
  }
}

// Check if the answer box is a set and compare elements recursively
function checkSet(
  answerMemoryBox: MemoryBox,
  inputMemoryBox: MemoryBox,
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  answerToInputMap: Map<number, { target: number; path: string }>,
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  duplicates: Set<number>,
  path: string,
  errors: FeedbackError[],
  visited: Map<number, Set<number>>
) {
  // we create a set of all IDs in the input set (we consider they are all initially unmatched),
  // then check to see if all IDs in the answer set can be matched with an ID in the input set
  const unmatched = new Set(inputMemoryBox.value); // a set of unmatched input IDs
  for (const answerChild of answerMemoryBox.value) {
    let matched = false;
    for (const inputChild of Array.from(unmatched)) {
      const errorsDetected: FeedbackError[] = [];
      const clonedVisited = new Map<number, Set<number>>();
      visited.forEach((set, key) => clonedVisited.set(key, new Set(set)));
      compareIds(
        answerChild,
        inputChild as number,
        answerMap,
        inputMap,
        new Map(answerToInputMap), // cloned maps (tentative)
        new Map(inputToAnswerMap),
        duplicates,
        `${path}{el}→`,
        errorsDetected,
        clonedVisited,
        inputMemoryBox.id ?? undefined // Pass the container ID as context
      );
      if (errorsDetected.length === 0) {
        // after recursive comparison, if no errors were detected, there is a match for the current input ID in the set
        unmatched.delete(inputChild);
        matched = true;
        break;
      }
    }
    if (!matched) errors.push({
      type: ErrorType.MISSING_ELEMENT,
      message: ERROR_MESSAGES.missing_element_in_set(path, answerChild),
      elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
      path,
      severity: 'error'
    });
  }

  // any IDs still in unmatched are unexpected extras supplied by the user
  for (const extraId of unmatched)
    errors.push(
      makeFeedbackError(
        ErrorType.UNEXPECTED_ELEMENT,
        ERROR_MESSAGES.unexpected_element_in_set(path, extraId as number),
        {
          elementId: inputMemoryBox.id ?? undefined,
          path,
          severity: 'error',
        }
      )
    );
}

// Check if the answer box is a dict and compare keys and values recursively
function checkDict(
  answerMemoryBox: MemoryBox,
  inputMemoryBox: MemoryBox,
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  answerToInputMap: Map<number, { target: number; path: string }>,
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  duplicates: Set<number>,
  path: string,
  errors: FeedbackError[],
  visited: Map<number, Set<number>>
) {
  // iterate over every key expected by the answer
  for (const key of Object.keys(answerMemoryBox.value)) {
    if (!(key in inputMemoryBox.value)) {
      // key missing entirely in the user dict
      const missingId = answerMemoryBox.value[key];
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: ERROR_MESSAGES.missing_dict_key(path, key, missingId),
        elementId: inputMemoryBox.id ?? undefined, // The container that's missing keys
        path,
        field: key,
        severity: 'error'
      });
      continue;
    }

    // if the key is present in both, we compare the two child IDs recursively
    compareIds(
      answerMemoryBox.value[key],
      inputMemoryBox.value[key],
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      `${path}[${key}]→`,
      errors,
      visited,
      inputMemoryBox.id ?? undefined // Pass the container ID as context
    );
  }

  // after looping expected keys, look for any keys that exist in the input dict only
  for (const key of Object.keys(inputMemoryBox.value)) {
    if (!(key in answerMemoryBox.value)) {
      const extraId = inputMemoryBox.value[key];
      errors.push(
        makeFeedbackError(
          ErrorType.UNEXPECTED_ELEMENT,
          ERROR_MESSAGES.unexpected_dict_key(path, key, extraId),
          {
            elementId: inputMemoryBox.id ?? undefined,
            path,
            field: key,
            severity: 'error',
          }
        )
      );
    }
  }
}

// Check if the answer box is an object and compare its properties recursively
function checkObject(
  answerMemoryBox: MemoryBox,
  inputMemoryBox: MemoryBox,
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  answerToInputMap: Map<number, { target: number; path: string }>,
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  duplicates: Set<number>,
  path: string,
  errors: FeedbackError[],
  visited: Map<number, Set<number>>
) {
  // Check if object names match
  if (answerMemoryBox.name !== inputMemoryBox.name) {
    const loc = formatPathForUser(path);
    errors.push({
      type: ErrorType.GENERIC_ERROR,
      message: ERROR_MESSAGES.object_name_mismatch(loc, answerMemoryBox.name!, inputMemoryBox.name!),
      elementId: inputMemoryBox.id ?? undefined,
      path,
      severity: 'error'
    });
    return;
  }

  const answerProps = answerMemoryBox.value as Record<string, number>;
  const inputProps = inputMemoryBox.value as Record<string, number>;

  // Check for missing properties
  for (const prop of Object.keys(answerProps)) {
    if (!(prop in inputProps)) {
      const loc = formatPathForUser(path);
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: ERROR_MESSAGES.missing_attribute(loc, answerMemoryBox.name!, prop),
        elementId: inputMemoryBox.id ?? undefined, // The container that's missing properties
        path,
        field: prop,
        severity: 'error'
      });
      continue;
    }

    // Compare property values recursively
    compareIds(
      answerProps[prop],
      inputProps[prop],
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      `${path}object "${answerMemoryBox.name}".${prop}→`,
      errors,
      visited,
      inputMemoryBox.id ?? undefined // Pass the container ID as context
    );
  }

  // Check for unexpected properties (skip empty/whitespace keys - invalid from frontend)
  for (const prop of Object.keys(inputProps)) {
    if (typeof prop !== "string" || !prop.trim()) continue;
    if (!(prop in answerProps)) {
      const loc = formatPathForUser(path);
      errors.push(
        makeFeedbackError(
          ErrorType.UNEXPECTED_ELEMENT,
          ERROR_MESSAGES.unexpected_attribute(loc, inputMemoryBox.name!, prop),
          {
            elementId: inputMemoryBox.id ?? undefined,
            path,
            field: prop,
            severity: 'error',
          }
        )
      );
    }
  }
}

// Gather frames from the answer and input models, checking for mismatches
function gatherFrames(
  answerModel: MemoryBox[],
  inputModel: MemoryBox[],
  errors: FeedbackError[]
) {
  const answerFrames = answerModel.filter((e) => e.type === ".frame");
  const inputFrames = inputModel.filter((e) => e.type === ".frame");

  if (answerFrames.length !== inputFrames.length)
    errors.push({
      type: ErrorType.FRAME_MISMATCH,
      message: ERROR_MESSAGES.call_stack_count(answerFrames.length, inputFrames.length),
      severity: 'error'
    });

  // Count frames by name to handle multiple frames with the same name
  const answerNameCounts = new Map<string, number>();
  const inputNameCounts = new Map<string, number>();

  for (const f of answerFrames) {
    answerNameCounts.set(f.name!, (answerNameCounts.get(f.name!) ?? 0) + 1);
  }
  for (const f of inputFrames) {
    inputNameCounts.set(f.name!, (inputNameCounts.get(f.name!) ?? 0) + 1);
  }

  // Check if frame names match (allowing for multiple frames with the same name)
  for (const [name, count] of answerNameCounts.entries()) {
    const inputCount = inputNameCounts.get(name) ?? 0;
    if (inputCount === 0) {
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: ERROR_MESSAGES.missing_function(name),
        path: `function "${name}"`,
        severity: 'error'
      });
    } else if (inputCount !== count) {
      errors.push({
        type: ErrorType.FRAME_MISMATCH,
        message: ERROR_MESSAGES.function_count_mismatch(count, name, inputCount),
        severity: 'error'
      });
    }
  }

  for (const [name, count] of inputNameCounts.entries()) {
    if (!answerNameCounts.has(name)) {
      errors.push(
        makeFeedbackError(
          ErrorType.UNEXPECTED_ELEMENT,
          ERROR_MESSAGES.unexpected_function(name),
          {
            path: `function "${name}"`,
            severity: 'error',
          }
        )
      );
    }
  }

  return { answerFrames, inputFrames };
}

// Scan for duplicate IDs in the user model and report them
function scanDuplicates(model: MemoryBox[], errors: FeedbackError[]): Set<number> {
  const dup = new Set<number>();
  const seen: Record<number, boolean> = {};
  for (const e of model)
    if (e.id !== null) {
      if (seen[e.id]) dup.add(e.id);
      else seen[e.id] = true;
    }
  dup.forEach((id) => errors.push({
    type: ErrorType.DUPLICATE_ID,
    message: ERROR_MESSAGES.duplicate_id(),
    elementId: id,
    severity: 'error'
  }));
  return dup;
}

// Compare frames from the answer and user model, checking for variable mismatches
function compareFrames(
  answerFrames: MemoryBox[],
  inputFrames: MemoryBox[],
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  globalAnswerToInput: Map<number, { target: number; path: string }>,
  globalInputToAnswer: Map<number, { target: number; path: string }>,
  dup: Set<number>,
  errors: FeedbackError[]
) {
  const visited = new Map<number, Set<number>>();

  // Sort frames by order to compare them 1:1
  const sortedAnswer = [...answerFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedInput = [...inputFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Compare each pair of frames
  for (let i = 0; i < sortedAnswer.length && i < sortedInput.length; i++) {
    const aFrame = sortedAnswer[i];
    const uFrame = sortedInput[i];
    const name = aFrame.name!;

    // Skip if names don't match (already reported by checkCallStackOrder)
    if (aFrame.name !== uFrame.name) continue;

    const aVars = aFrame.value as Record<string, number>;
    const uVars = uFrame.value as Record<string, number>;

    // variable-list mismatches
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) {
        const message = ERROR_MESSAGES.variable_missing(name, k);
    
        errors.push(
          makeFeedbackError(ErrorType.MISSING_ELEMENT, message, {
            elementId: uFrame.id ?? undefined,
            path: `function "${name}" → var "${k}"`,
            severity: 'error',
          })
        );
      }
    }
    for (const k of Object.keys(uVars))
      if (!(k in aVars))
        errors.push(
          makeFeedbackError(
            ErrorType.UNEXPECTED_ELEMENT,
            ERROR_MESSAGES.variable_unexpected(name, k),
            {
              elementId: uFrame.id ?? undefined,
              path: `function "${name}" → var "${k}"`,
              severity: 'error',
            }
          )
        );

    // deep comparison for shared variables
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) continue;

      const uid = (uVars as Record<string, any>)[k];
      if (uid === "_") {
        errors.push({
          type: ErrorType.GENERIC_ERROR,
          message: ERROR_MESSAGES.variable_unassigned(name, k),
          path: `function "${name}" → var "${k}"`,
          severity: 'error'
        });
        continue;
      }

      compareIds(
        aVars[k],
        uVars[k],
        answerMap,
        inputMap,
        globalAnswerToInput,
        globalInputToAnswer,
        dup,
        `function "${name}" → var "${k}"→`,
        errors,
        visited,
        uFrame.id ?? undefined // Pass the frame ID for error context
      );
    }
  }
}

// Returns the set of object IDs reachable by following pointers from the given frames
function computeReachable(frames: MemoryBox[], objectMap: Map<number, MemoryBox>): Set<number> {
  const reachable = new Set<number>();
  function mark(id: number) {
    if (reachable.has(id)) return;
    reachable.add(id);
    const e = objectMap.get(id);
    if (!e || !isContainer(e.type)) return;
    if (isArrayType(e.type) || isSetType(e.type))
      e.value.forEach((c: number) => mark(c));
    else if (isDictType(e.type))
      Object.values(e.value).forEach((c) => mark(c as number));
    else if (isClassInstanceType(e.type))
      Object.values(e.value).forEach((c) => mark(c as number));
  }
  for (const frame of frames)
    Object.values(frame.value as Record<string, number>).forEach(mark);
  return reachable;
}

function detectOrphans(
  answerFrames: MemoryBox[],
  inputFrames: MemoryBox[],
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  answerModel: MemoryBox[],
  userModel: MemoryBox[],
  dup: Set<number>,
  errors: FeedbackError[]
) {
  const answerReachable = computeReachable(answerFrames, answerMap);
  const userReachable   = computeReachable(inputFrames,  inputMap);

  // Non-frame elements not reachable from their respective frames
  const answerOrphans = answerModel.filter(
    e => e.id !== null && e.type !== '.frame' && !answerReachable.has(e.id as number)
  );
  const userOrphans = userModel.filter(
    e => e.id !== null && e.type !== '.frame' && !userReachable.has(e.id as number) && !dup.has(e.id as number)
  );

  // Greedily match user orphans to answer orphans by (type, value)
  const remainingUser = [...userOrphans];
  for (const aOrphan of answerOrphans) {
    const idx = remainingUser.findIndex(
      u => u.type === aOrphan.type && JSON.stringify(u.value) === JSON.stringify(aOrphan.value)
    );
    if (idx === -1) {
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: ERROR_MESSAGES.missing_unattached_object(aOrphan.type, aOrphan.value),
        severity: 'error'
      });
    } else {
      remainingUser.splice(idx, 1);
    }
  }

  // Any unmatched user orphan is unreachable from the call stack.
  for (const uOrphan of remainingUser) {
    const message = ERROR_MESSAGES.unexpected_unattached_object(uOrphan.id as number);

    errors.push(
      makeFeedbackError(ErrorType.UNREACHABLE_OBJECT, message, {
        elementId: uOrphan.id as number,
        severity: 'error',
      })
    );
  }
}

// Compare IDs between the answer and user models
function compareIds(
  answerID: number, // ID in the answer model
  inputID: number, // ID in the user model
  answerMap: Map<number, MemoryBox>, // maps ID → MemoryBox for answer
  inputMap: Map<number, MemoryBox>, // maps ID → MemoryBox for user
  // answerID ↦ { target: inputID, path } — records which user-ID
  // an answer-ID is mapped to and the path to it
  answerToInputMap: Map<number, { target: number; path: string }>,
  // inputID  ↦ { target: answerID, path } — mirror of the above
  inputToAnswerMap: Map<number, { target: number; path: string }>,
  duplicates: Set<number>, // user IDs reused in two boxes
  path: string, // path to the current box, e.g. "frame 'main' → var 'a'→"
  errors: FeedbackError[], // collects error messages
  visited: Map<number, Set<number>>, // map of pairs: answerID → {inputID,…}
  contextFrameId?: number // ID of the frame containing this variable (for error context)
) {
  // skip if this input ID is already known to be a duplicate, we report this error later
  if (duplicates.has(inputID)) return;

  // skip if this pair of IDs has already been visited
  const visitedByAnswer = visited.get(answerID);
  if (visitedByAnswer?.has(inputID)) return;
  if (visitedByAnswer) {
    visitedByAnswer.add(inputID);
  } else {
    visited.set(answerID, new Set([inputID]));
  }

  const answerMemoryBox = answerMap.get(answerID);
  const inputMemoryBox = inputMap.get(inputID);
  if (!answerMemoryBox || !inputMemoryBox) {
    // if either ID is not found in the respective map
    const cleanPath = path.endsWith('→') ? path.slice(0, -1) : path;
    const frameMatch = cleanPath.match(/function "([^"]+)"/);
    const varMatch = cleanPath.match(/var "([^"]+)"/);
    const frameName = frameMatch ? frameMatch[1] : cleanPath;
    const varName = varMatch ? varMatch[1] : cleanPath;
    const unmappedMessage = frameMatch && varMatch
      ? ERROR_MESSAGES.unmapped_variable(varName, frameName)
      : ERROR_MESSAGES.unmapped_id_fallback(cleanPath);
    
    errors.push(
      makeFeedbackError(ErrorType.INVALID_REFERENCE, unmappedMessage, {
        path,
        severity: 'error',
      })
    );
    return;
  }

  // ID mapping check
  const isVar = /^var "[^"]+"→$/.test(path); // test if this is a variable
  if (
    ensureBijection(
      answerID,
      inputID,
      answerToInputMap,
      inputToAnswerMap,
      isVar,
      path,
      errors,
      contextFrameId
    )
  )
    return;

  // Type check
  if (checkTypeMismatch(answerMemoryBox, inputMemoryBox, path, errors, contextFrameId)) return;

  // Primitive check
  if (comparePrimitives(answerMemoryBox, inputMemoryBox, path, errors, contextFrameId)) return;

  // Array type box check
  if (isArrayType(answerMemoryBox.type)) {
    checkArray(
      answerMemoryBox,
      inputMemoryBox,
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      path,
      errors,
      visited
    );
    return;
  }

  // Set type box check
  if (isSetType(answerMemoryBox.type)) {
    checkSet(
      answerMemoryBox,
      inputMemoryBox,
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      path,
      errors,
      visited
    );
    return;
  }

  // Dict type box check
  if (isDictType(answerMemoryBox.type)) {
    checkDict(
      answerMemoryBox,
      inputMemoryBox,
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      path,
      errors,
      visited
    );
    return;
  }

  // Object type box check (includes .class from answer format)
  if (isObjectType(answerMemoryBox.type) || answerMemoryBox.type === ".class") {
    checkObject(
      answerMemoryBox,
      inputMemoryBox,
      answerMap,
      inputMap,
      answerToInputMap,
      inputToAnswerMap,
      duplicates,
      path,
      errors,
      visited
    );
    return;
  }
}

// Check if the call stack order matches between answer and input.
// Both answer and input frames have an 'order' field that represents the call stack position.
// Order 1 is the bottom of the stack (e.g., __main__), higher numbers are later calls.
// The UI displays frames bottom-to-top, so we sort by order ascending for comparison.
function checkCallStackOrder(
  answerFrames: MemoryBox[],
  inputFrames: MemoryBox[],
  errors: FeedbackError[]
) {
  if (answerFrames.length !== inputFrames.length) return; // size already handled

  // Sort both by order field (ascending)
  const sortedAnswer = [...answerFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedInput = [...inputFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (let i = 0; i < sortedAnswer.length; i++) {
    if (sortedAnswer[i].name !== sortedInput[i].name) {
      errors.push({
        type: ErrorType.CALL_STACK_ORDER,
        message: ERROR_MESSAGES.call_stack_order(),
        severity: 'error'
      });
      break;
    }
  }
}

async function fetchAnswerModel(
  questionType: "test" | "practice" | "prep" | "experiment",
  questionId: number
): Promise<MemoryBox[] | null> {
  let rows: { answer: unknown }[] = [];
  if (questionType === "practice") {
    const result = await getPool().query<{ answer: unknown }>(
      "SELECT answer FROM practice_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else if (questionType === "prep") {
    const result = await getPool().query<{ answer: unknown }>(
      "SELECT answer FROM prep_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else if (questionType === "experiment") {
    const result = await getPool().query<{ answer: unknown }>(
      "SELECT answer FROM experiment_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else {
    const result = await getPool().query<{ answer: unknown }>(
      "SELECT answer FROM test_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  }

  const raw = rows[0].answer;
  if (!Array.isArray(raw)) {
    throw new Error("Answer in DB is not an array");
  }
  return raw as MemoryBox[];
}

/* ---------- shared comparison logic ---------- */
function runComparison(
  userModel: MemoryBox[],
  answerModel: MemoryBox[]
): { correct: boolean; errors: FeedbackError[] } {
  const errors: FeedbackError[] = [];

  // gather frames from both models
  const { answerFrames, inputFrames } = gatherFrames(
    answerModel,
    userModel,
    errors
  );

  // check for function + function call stack errors
  const hasFunctionErrors = errors.some(
    (e) =>
      e.message.startsWith("Call stack should have") ||
      e.message.startsWith("Call stack is missing") ||
      e.message.startsWith("Call stack has an unexpected")
  );
  if (!hasFunctionErrors) {
    checkCallStackOrder(answerFrames, inputFrames, errors);
  }

  // get duplicate IDs in the user model
  const dup = scanDuplicates(userModel, errors);

  const answerMap = idMap(answerModel);
  const inputMap = idMap(userModel);

  const globalAnswerToInput = new Map<
    number,
    { target: number; path: string }
  >();
  const globalInputToAnswer = new Map<
    number,
    { target: number; path: string }
  >();

  // compare frames
  compareFrames(
    answerFrames,
    inputFrames,
    answerMap,
    inputMap,
    globalAnswerToInput,
    globalInputToAnswer,
    dup,
    errors
  );

  // detect orphans in the user model
  detectOrphans(answerFrames, inputFrames, answerMap, inputMap, answerModel, userModel, dup, errors);

  return { correct: errors.length === 0, errors };
}

/* ---------- main validation function ---------- */
export default async function validateAnswer(
  userModel: MemoryBox[],
  questionId: number,
  questionType: "test" | "practice" | "prep" | "experiment"
): Promise<{
  correct: boolean;
  errors: FeedbackError[];
}> {
  const answerModel = await fetchAnswerModel(questionType, questionId);
  if (!answerModel) {
    return {
      correct: false,
      errors: [{
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.invalid_question_id(questionId),
        severity: 'error'
      }],
    };
  }

  return runComparison(userModel, answerModel);
}

/* ---------- line-specific validation ---------- */
type QuestionStep = { lineNumber: number; iterationNumber?: number; answer: unknown };

async function fetchStepsModel(
  questionType: "test" | "practice" | "prep" | "experiment",
  questionId: number,
  lineNumber: number,
  iterationNumber?: number
): Promise<MemoryBox[] | "no_steps" | null> {
  const table =
    questionType === "practice"
      ? "practice_questions"
      : questionType === "prep"
      ? "prep_questions"
      : questionType === "experiment"
      ? "experiment_questions"
      : "test_questions";

  const result = await getPool().query<{ steps: unknown }>(
    `SELECT steps FROM ${table} WHERE id = $1`,
    [questionId]
  );
  if (result.rows.length === 0) return null;

  const steps = result.rows[0].steps;
  if (!Array.isArray(steps)) return "no_steps";

  const step = (steps as QuestionStep[]).find(
    (s) => s.lineNumber === lineNumber && s.iterationNumber === iterationNumber
  );
  if (!step) return "no_steps";

  if (!Array.isArray(step.answer)) {
    throw new Error(`Step answer for line ${lineNumber} is not an array`);
  }
  return step.answer as MemoryBox[];
}

export async function validateAnswerAtLine(
  userModel: MemoryBox[],
  questionId: number,
  questionType: "test" | "practice" | "prep" | "experiment",
  lineNumber: number,
  iterationNumber?: number
): Promise<{ correct: boolean; errors: FeedbackError[] }> {
  const stepModel = await fetchStepsModel(questionType, questionId, lineNumber, iterationNumber);

  if (stepModel === null) {
    return {
      correct: false,
      errors: [{
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.invalid_question_id(questionId),
        severity: 'error'
      }],
    };
  }

  if (stepModel === "no_steps") {
    return {
      correct: false,
      errors: [{
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.no_answer_for_line(lineNumber, iterationNumber),
        severity: 'error'
      }],
    };
  }

  return runComparison(userModel, stepModel);
}
