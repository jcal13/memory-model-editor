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
    case ErrorType.REFERENCE_MISMATCH:
      return "Reference mismatch";
    case ErrorType.DUPLICATE_NONE_OBJECT:
      return "Duplicate None object";
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
  answerMap: Map<number, MemoryBox>,
  isVar: boolean,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  const cleanPathForUser = (p: string, id?: number) => {
    if (id !== undefined && varNameByInputId.has(id)) {
      return varNameByInputId.get(id)!;
    }
    return formatPathForUser(p);
  };
  const currentPath = cleanPathForUser(path, inputID);

  // Case 1: one expected object maps to multiple drawn objects.
  if (answerToInputMap.has(answerID)) {
    const prev = answerToInputMap.get(answerID)!;

    if (prev.target !== inputID) {
      if (!isVar) {
        const previousPath = cleanPathForUser(prev.path, prev.target);
        const answerBox = answerMap.get(answerID);

        const message = ERROR_MESSAGES.reference_should_point_to(previousPath, currentPath);

        errors.push(
          makeFeedbackError(ErrorType.REFERENCE_MISMATCH, message, {
            elementId: contextFrameId ?? inputID,
            path,
            severity: 'error'
          })
        );
      }

      return true;
    }
  }

  // Case 2: one drawn object maps to multiple expected objects.
  if (inputToAnswerMap.has(inputID)) {
    const prev = inputToAnswerMap.get(inputID)!;

    if (prev.target !== answerID) {
      if (!isVar) {
        const previousPath = cleanPathForUser(prev.path, prev.target);

        errors.push(
          makeFeedbackError(
            ErrorType.REFERENCE_MISMATCH,
            ERROR_MESSAGES.reference_should_differ(previousPath, currentPath),
            {
              elementId: contextFrameId ?? inputID,
              path,
              severity: 'error'
            }
          )
        );
      }

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

// Maps input element ID → variable name for direct path resolution
let varNameByInputId = new Map<number, string>();
let answerFramesForPath: MemoryBox[] = [];

const FRAME_VAR_PATH_RE = /^function "([^"]+)" → var "([^"]+)"$/;
type FrameVariableOrder = Map<string, Map<string, number>>;

// Rebuild variable order from first assignment in the question source code
function deriveFrameVariableOrderFromCode(code: string[]): FrameVariableOrder {
  const orderByFrame: FrameVariableOrder = new Map();
  let nextOrder = 0;

  const ensureFrameOrder = (frameName: string): Map<string, number> => {
    let frameOrder = orderByFrame.get(frameName);
    if (!frameOrder) {
      frameOrder = new Map<string, number>();
      orderByFrame.set(frameName, frameOrder);
    }
    return frameOrder;
  };

  const recordFirstAssignment = (frameName: string, varName: string) => {
    const frameOrder = ensureFrameOrder(frameName);
    if (!frameOrder.has(varName)) {
      frameOrder.set(varName, nextOrder++);
    }
  };

  const scopeStack: Array<{
    indent: number;
    kind: "function" | "class";
    name: string;
  }> = [];

  for (const rawLine of code) {
    const line = rawLine.replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = (line.match(/^ */)?.[0].length ?? 0);

    while (
      scopeStack.length > 0 &&
      indent <= scopeStack[scopeStack.length - 1].indent
    ) {
      scopeStack.pop();
    }

    const functionMatch = trimmed.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (functionMatch) {
      scopeStack.push({
        indent,
        kind: "function",
        name: functionMatch[1],
      });
      continue;
    }

    const classMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (classMatch) {
      scopeStack.push({
        indent,
        kind: "class",
        name: classMatch[1],
      });
      continue;
    }

    const currentFunctionScope = [...scopeStack]
      .reverse()
      .find((scope) => scope.kind === "function");

    const frameName = currentFunctionScope?.name ?? "__main__";

    const assignmentMatch = trimmed.match(
      /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|\+=|-=|\*=|\/=|%=|\/\/=|\*\*=)/
    );

    if (assignmentMatch) {
      recordFirstAssignment(frameName, assignmentMatch[1]);
    }
  }

  return orderByFrame;
}

// Restore source code order for missing variables only
function sortMissingFrameVariableErrorsBySourceOrder(
  errors: FeedbackError[],
  code?: string[]
): FeedbackError[] {
  if (!code || code.length === 0) return errors;

  const frameVariableOrder = deriveFrameVariableOrderFromCode(code);

  const sortableEntries = errors
    .map((error, index) => {
      if (error.type !== ErrorType.MISSING_ELEMENT || !error.path) return null;

      const match = error.path.match(FRAME_VAR_PATH_RE);
      if (!match) return null;

      const [, frameName, varName] = match;
      const frameOrder = frameVariableOrder.get(frameName);
      const sourceOrder = frameOrder?.get(varName);

      if (sourceOrder === undefined) return null;

      return { index, error, sourceOrder };
    })
    .filter(
      (
        entry
      ): entry is {
        index: number;
        error: FeedbackError;
        sourceOrder: number;
      } => entry !== null
    );

  if (sortableEntries.length < 2) return errors;

  const reorderedErrors = [...sortableEntries]
    .sort((a, b) => a.sourceOrder - b.sourceOrder || a.index - b.index)
    .map((entry) => entry.error);

  const nextErrors = [...errors];
  sortableEntries.forEach((entry, idx) => {
    nextErrors[entry.index] = reorderedErrors[idx];
  });

  return nextErrors;
}

function getBestAnswerPath(
  answerID: number,
  answerFrames: MemoryBox[],
  answerMap: Map<number, MemoryBox>
): string | undefined {
  const queue: { id: number; path: string }[] = [];

  for (const frame of answerFrames) {
    const vars = frame.value as Record<string, number>;
    for (const [varName, id] of Object.entries(vars)) {
      queue.push({ id, path: varName });
    }
  }

  const seen = new Set<number>();

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.id === answerID) return cur.path;
    if (seen.has(cur.id)) continue;
    seen.add(cur.id);

    const box = answerMap.get(cur.id);
    if (!box || !isObjectType(box.type)) continue;

    const props = box.value as Record<string, number>;
    for (const [prop, nextId] of Object.entries(props)) {
      queue.push({ id: nextId, path: `${cur.path}.${prop}` });
    }
  }

  return undefined;
}

// Converts technical path to a shorter, user-friendly description
function formatPathForUser(path: string): string {
  const varMatch = path.match(/var\s+"([^"]+)"/);
  if (!varMatch) return path.replace(/→$/, "").trim() || path;

  const props = [...path.matchAll(/object\s+"[^"]+"\.([\w]+)/g)].map(
    (m) => m[1]
  );

  return [varMatch[1], ...props].join(".");
}

// Check whether a reference mismatch has already been reported for this path
function hasReferenceMismatchAtPath(errors: FeedbackError[], path: string): boolean {
  const formattedPath = formatPathForUser(path);

  return errors.some((error) => {
    if (error.type !== ErrorType.REFERENCE_MISMATCH) return false;

    const errorPath = error.path ? formatPathForUser(error.path) : "";

    return (
      error.path === path ||
      errorPath === formattedPath ||
      error.message.includes(formattedPath)
    );
  });
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
  const inputId = inputBox.id ?? undefined;
  const loc = (inputId !== undefined && varNameByInputId.has(inputId))
    ? varNameByInputId.get(inputId)!
    : formatPathForUser(path);
  const cleanLoc = loc;
  if (isClassInstanceType(answerBox.type)) {
    if (!hasReferenceMismatchAtPath(errors, path)) {
      errors.push(
        makeFeedbackError(
          ErrorType.INVALID_REFERENCE,
          ERROR_MESSAGES.object_incorrectly_connected(cleanLoc),
          {
            elementId: contextFrameId ?? inputBox.id ?? undefined,
            relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
            path,
            severity: 'error'
          }
        )
      );
    }
    return true;
  }
  
  errors.push(
    makeFeedbackError(
      ErrorType.TYPE_MISMATCH,
      ERROR_MESSAGES.type_mismatch(
        loc,
        formatTypeForUser(answerBox.type),
        formatTypeForUser(inputBox.type)
      ),
      {
        elementId: contextFrameId ?? inputBox.id ?? undefined,
        relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
        path,
        severity: 'error'
      }
    )
  );
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
      errors.push(
        makeFeedbackError(
          ErrorType.VALUE_MISMATCH,
          ERROR_MESSAGES.value_mismatch(loc, expectedStr, gotStr),
          {
            elementId: contextFrameId ?? inputBox.id ?? undefined,
            relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
            path,
            severity: 'error'
          }
        )
      );
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
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_element_at_index(path, i, answerMemoryBox.value[i]),
          {
            elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
            path: `${path}[${i}]`,
            severity: 'error'
          }
        )
      );

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
    if (!matched)
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_element_in_set(path, answerChild),
          {
            elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
            path,
            severity: 'error'
          }
        )
      );
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
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_dict_key(path, key, missingId),
          {
            elementId: inputMemoryBox.id ?? undefined, // The container that's missing keys
            path,
            field: key,
            severity: 'error'
          }
        )
      );
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
    errors.push(
      makeFeedbackError(
        ErrorType.TYPE_MISMATCH,
        ERROR_MESSAGES.object_name_mismatch(loc, answerMemoryBox.name!, inputMemoryBox.name!),
        {
          elementId: inputMemoryBox.id ?? undefined,
          path,
          severity: 'error'
        }
      )
    );
    return;
  }

  const answerProps = answerMemoryBox.value as Record<string, number>;
  const inputProps = inputMemoryBox.value as Record<string, number>;

  // Check for missing properties
  for (const prop of Object.keys(answerProps)) {
    if (!(prop in inputProps)) {
      const loc = formatPathForUser(path);
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_attribute(loc, answerMemoryBox.name!, prop),
          {
            elementId: inputMemoryBox.id ?? undefined, // The container that's missing properties
            path,
            field: prop,
            severity: 'error'
          }
        )
      );
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
    errors.push(
      makeFeedbackError(
        ErrorType.FRAME_MISMATCH,
        ERROR_MESSAGES.call_stack_count(answerFrames.length, inputFrames.length),
        {
          severity: 'error'
        }
      )
    );

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
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_function(name),
          {
            path: `function "${name}"`,
            severity: 'error'
          }
        )
      );
    } else if (inputCount !== count) {
      errors.push(
        makeFeedbackError(
          ErrorType.FRAME_MISMATCH,
          ERROR_MESSAGES.function_count_mismatch(count, name, inputCount),
          {
            severity: 'error'
          }
        )
      );
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
    dup.forEach((id) =>
      errors.push(
        makeFeedbackError(
          ErrorType.DUPLICATE_ID,
          ERROR_MESSAGES.duplicate_id(),
          {
            elementId: id,
            severity: 'error'
          }
        )
      )
    );
  return dup;
}

function walkGraph(id: number, path: string, inputMap: Map<number, MemoryBox>) {
  if (varNameByInputId.has(id)) return;
  varNameByInputId.set(id, path);
  const box = inputMap.get(id);
  if (!box || !isObjectType(box.type)) return;
  const props = box.value as Record<string, number>;
  for (const prop of Object.keys(props)) {
    walkGraph(props[prop], `${path}.${prop}`, inputMap);
  }
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

    // first pass: populate varNameByInputId for all variables before compareIds runs
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) continue;
      const uid = (uVars as Record<string, any>)[k];
      if (uid === "_") continue;
      varNameByInputId.set(uid, k);
      const directBox = inputMap.get(uid);
      if (directBox && isObjectType(directBox.type)) {
        const props = directBox.value as Record<string, number>;
        for (const prop of Object.keys(props)) {
          if (!varNameByInputId.has(props[prop])) {
            walkGraph(props[prop], `${k}.${prop}`, inputMap);
          }
        }
      }
    }

    // deep comparison for shared variables
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) continue;

      const uid = (uVars as Record<string, any>)[k];
      if (uid === "_") {
        errors.push(
          makeFeedbackError(
            ErrorType.INVALID_REFERENCE,
            ERROR_MESSAGES.variable_unassigned(name, k),
            {
              path: `function "${name}" → var "${k}"`,
              severity: 'error'
            }
          )
        );
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
      errors.push(
        makeFeedbackError(
          ErrorType.MISSING_ELEMENT,
          ERROR_MESSAGES.missing_unattached_object(aOrphan.type, aOrphan.value),
          {
            severity: 'error'
          }
        )
      );
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
    const loc =
    !inputMemoryBox
      ? getBestAnswerPath(answerID, answerFramesForPath, answerMap) ?? formatPathForUser(path)
      : formatPathForUser(path);

  const isDirectVariablePath =
    /^function\s+"[^"]+"\s*→\s*var\s+"[^"]+"\s*→?$/.test(path);

  const frameMatch = path.match(/function "([^"]+)"/);
  const varMatch = path.match(/var "([^"]+)"/);

  const message =
    isDirectVariablePath && frameMatch && varMatch
      ? ERROR_MESSAGES.unmapped_variable(varMatch[1], frameMatch[1])
      : ERROR_MESSAGES.object_incorrectly_connected(loc);

    errors.push(
      makeFeedbackError(ErrorType.INVALID_REFERENCE, message, {
        path,
        severity: 'error',
      })
    );
    return;
  }

  // update path map with the shortest known path for this inputID
  const derivedPath = formatPathForUser(path);
  if (derivedPath) {
    const existing = varNameByInputId.get(inputID);
    if (!existing || derivedPath.split('.').length < existing.split('.').length) {
      varNameByInputId.set(inputID, derivedPath);
    }
  }

  // ID mapping check
  const isVar = /^var "[^"]+"→$/.test(path); // test if this is a variable
  if (
    ensureBijection(
      answerID,
      inputID,
      answerToInputMap,
      inputToAnswerMap,
      answerMap,
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
      errors.push(
        makeFeedbackError(
          ErrorType.CALL_STACK_ORDER,
          ERROR_MESSAGES.call_stack_order(),
          {
            severity: 'error'
          }
        )
      );
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

// Fetch the original question code so that validation can derive source variable order
async function fetchQuestionCode(
  questionType: "test" | "practice" | "prep" | "experiment",
  questionId: number
): Promise<string[] | null> {
  let rows: { code: unknown }[] = [];
  if (questionType === "practice") {
    const result = await getPool().query<{ code: unknown }>(
      "SELECT code FROM practice_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else if (questionType === "prep") {
    const result = await getPool().query<{ code: unknown }>(
      "SELECT code FROM prep_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else if (questionType === "experiment") {
    const result = await getPool().query<{ code: unknown }>(
      "SELECT code FROM experiment_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  } else {
    const result = await getPool().query<{ code: unknown }>(
      "SELECT code FROM test_questions WHERE id = $1",
      [questionId]
    );
    rows = result.rows;
    if (rows.length === 0) return null;
  }

  const raw = rows[0].code;
  if (!Array.isArray(raw)) {
    throw new Error("Code in DB is not an array");
  }
  return raw as string[];
}

/* ---------- shared comparison logic ---------- */
function checkDuplicateNoneObjects(
  inputMap: Map<number, MemoryBox>,
  errors: FeedbackError[]
): void {
  const noneIds = Array.from(inputMap.values())
    .filter((box) => box.type === "NoneType" && box.id !== null)
    .map((box) => box.id as number);

  if (noneIds.length <= 1) return;

  errors.push(
    makeFeedbackError(
      ErrorType.DUPLICATE_NONE_OBJECT,
      ERROR_MESSAGES.duplicate_none_objects(noneIds),
      {
        elementId: noneIds[0],
        relatedIds: noneIds.slice(1),
        path: "None",
        severity: "error"
      }
    )
  );
}

function runComparison(
  userModel: MemoryBox[],
  answerModel: MemoryBox[],
  code?: string[]
): { correct: boolean; errors: FeedbackError[] } {
  const errors: FeedbackError[] = [];
  varNameByInputId = new Map<number, string>();

  // gather frames from both models
  const { answerFrames, inputFrames } = gatherFrames(
    answerModel,
    userModel,
    errors
  );

  answerFramesForPath = answerFrames;
  
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

  checkDuplicateNoneObjects(inputMap, errors);

  const orderedErrors = sortMissingFrameVariableErrorsBySourceOrder(errors, code);

  return { correct: orderedErrors.length === 0, errors: orderedErrors };
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
  const [answerModel, code] = await Promise.all([
    fetchAnswerModel(questionType, questionId),
    fetchQuestionCode(questionType, questionId)
  ]);

  if (!answerModel || !code) {
    return {
      correct: false,
      errors: [{
        type: ErrorType.GENERIC_ERROR,
        message: ERROR_MESSAGES.invalid_question_id(questionId),
        severity: 'error'
      }],
    };
  }

  return runComparison(userModel, answerModel, code);
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
  const [stepModel, code] = await Promise.all([
    fetchStepsModel(questionType, questionId, lineNumber, iterationNumber),
    fetchQuestionCode(questionType, questionId)
  ]);

  if (stepModel === null || code === null) {
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

  return runComparison(userModel, stepModel, code);
}
