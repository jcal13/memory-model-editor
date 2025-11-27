import { Pool } from "pg";
import { FeedbackError, ErrorType } from "./errorStructuring";

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
};

/* ---------- helpers ---------- */
const isArrayType = (t: string) => ["list", "tuple"].includes(t);
const isSetType = (t: string) => t === "set";
const isDictType = (t: string) => t === "dict";
const isObjectType = (t: string) => t === "object";
const isContainer = (t: string) =>
  isArrayType(t) || isSetType(t) || isDictType(t) || isObjectType(t);

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
        message: `ID mapping conflict: ${prev.path}", "${path}`,
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
        message: `ID mapping conflict: ${prev.path}, ${path}`,
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

// Check if the type of the answer box matches the input box
function checkTypeMismatch(
  answerBox: MemoryBox,
  inputBox: MemoryBox,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  if (answerBox.type !== inputBox.type) {
    errors.push({
      type: ErrorType.TYPE_MISMATCH,
      message: `Type mismatch: ${path} got ${inputBox.type}, expected ${answerBox.type}`,
      elementId: contextFrameId ?? inputBox.id ?? undefined,
      relatedIds: inputBox.id !== null && inputBox.id !== contextFrameId ? [inputBox.id] : undefined,
      path,
      severity: 'error'
    });
    return true;
  }
  return false;
}

// Check if the answer box is a primitive type and compare values
function comparePrimitives(
  answerBox: MemoryBox,
  inputBox: MemoryBox,
  path: string,
  errors: FeedbackError[],
  contextFrameId?: number
): boolean {
  if (!isContainer(answerBox.type)) {
    if (answerBox.value !== inputBox.value) {
      errors.push({
        type: ErrorType.VALUE_MISMATCH,
        message: `Value mismatch: ${path} got ${inputBox.value}, expected ${answerBox.value}`,
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
        message: `Missing element: ${path}[${i}] id=${answerMemoryBox.value[i]}`,
        elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
        path: `${path}[${i}]`,
        severity: 'error'
      });

  if (actualLen > expectedLen)
    for (let j = expectedLen; j < actualLen; j++)
      errors.push({
        type: ErrorType.UNEXPECTED_ELEMENT,
        message: `Unexpected element: ${path}[${j}] id=${inputMemoryBox.value[j]}`,
        elementId: inputMemoryBox.id ?? undefined, // The container with unexpected elements
        path: `${path}[${j}]`,
        severity: 'error'
      });

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
      message: `Missing element: ${path} id=${answerChild}`,
      elementId: inputMemoryBox.id ?? undefined, // The container that's missing elements
      path,
      severity: 'error'
    });
  }

  // any IDs still in unmatched are unexpected extras supplied by the user
  for (const extraId of unmatched)
    errors.push({
      type: ErrorType.UNEXPECTED_ELEMENT,
      message: `Unexpected element: ${path} id=${extraId}`,
      elementId: inputMemoryBox.id ?? undefined, // The container with unexpected elements
      path,
      severity: 'error'
    });
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
        message: `Missing key: ${path} key=${key}, id=${missingId}`,
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
      errors.push({
        type: ErrorType.UNEXPECTED_ELEMENT,
        message: `Unexpected key: ${path} key=${key}, id=${extraId}`,
        elementId: inputMemoryBox.id ?? undefined, // The container with unexpected keys
        path,
        field: key,
        severity: 'error'
      });
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
    errors.push({
      type: ErrorType.GENERIC_ERROR,
      message: `Object name mismatch: ${path} got "${inputMemoryBox.name}", expected "${answerMemoryBox.name}"`,
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
      errors.push({
        type: ErrorType.MISSING_ELEMENT,
        message: `Missing object property: ${path} object "${answerMemoryBox.name}" expected property "${prop}"`,
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

  // Check for unexpected properties
  for (const prop of Object.keys(inputProps)) {
    if (!(prop in answerProps)) {
      errors.push({
        type: ErrorType.UNEXPECTED_ELEMENT,
        message: `Unexpected object property: ${path} object "${inputMemoryBox.name}" has unexpected property "${prop}"`,
        elementId: inputMemoryBox.id ?? undefined,
        path,
        field: prop,
        severity: 'error'
      });
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
      message: `Function count mismatch: expected ${answerFrames.length}, got ${inputFrames.length}`,
      severity: 'error'
    });

  const ansByName = new Map(answerFrames.map((f) => [f.name!, f]));
  const usrByName = new Map(inputFrames.map((f) => [f.name!, f]));

  for (const n of ansByName.keys())
    if (!usrByName.has(n)) errors.push({
      type: ErrorType.MISSING_ELEMENT,
      message: `Missing function: "${n}"`,
      path: `function "${n}"`,
      severity: 'error'
    });
  for (const n of usrByName.keys())
    if (!ansByName.has(n)) errors.push({
      type: ErrorType.UNEXPECTED_ELEMENT,
      message: `Unexpected function: "${n}"`,
      path: `function "${n}"`,
      severity: 'error'
    });

  return { answerFrames, inputFrames, ansByName, usrByName };
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
    message: `Duplicate ID: ${id}`,
    elementId: id,
    severity: 'error'
  }));
  return dup;
}

// Compare frames from the answer and user model, checking for variable mismatches
function compareFrames(
  ansByName: Map<string, MemoryBox>,
  usrByName: Map<string, MemoryBox>,
  answerMap: Map<number, MemoryBox>,
  inputMap: Map<number, MemoryBox>,
  globalAnswerToInput: Map<number, { target: number; path: string }>,
  globalInputToAnswer: Map<number, { target: number; path: string }>,
  dup: Set<number>,
  errors: FeedbackError[]
) {
  const visited = new Map<number, Set<number>>();

  for (const [name, aFrame] of ansByName.entries()) {
    if (!usrByName.has(name)) continue; // already logged as missing

    const uFrame = usrByName.get(name)!;
    const aVars = aFrame.value as Record<string, number>;
    const uVars = uFrame.value as Record<string, number>;

    // variable-list mismatches
    for (const k of Object.keys(aVars))
      if (!(k in uVars))
        errors.push({
          type: ErrorType.MISSING_ELEMENT,
          message: `Missing variable: function "${name}" expected "${k}"`,
          elementId: uFrame.id ?? undefined,
          path: `function "${name}" → var "${k}"`,
          severity: 'error'
        });
    for (const k of Object.keys(uVars))
      if (!(k in aVars))
        errors.push({
          type: ErrorType.UNEXPECTED_ELEMENT,
          message: `Unexpected variable: function "${name}" unexpected "${k}"`,
          elementId: uFrame.id ?? undefined,
          path: `function "${name}" → var "${k}"`,
          severity: 'error'
        });

    // deep comparison for shared variables
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) continue;

      const uid = (uVars as Record<string, any>)[k];
      if (uid === "_") {
        errors.push({
          type: ErrorType.GENERIC_ERROR,
          message: `Unassigned variable: function "${name}" variable "${k}" has no assigned ID`,
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

// Detect orphans in the user model
function detectOrphans(
  inputFrames: MemoryBox[],
  inputMap: Map<number, MemoryBox>,
  model: MemoryBox[],
  answerMap: Map<number, MemoryBox>,
  errors: FeedbackError[]
) {
  const reachable = new Set<number>();
  function mark(id: number) {
    if (reachable.has(id)) return;
    reachable.add(id);
    const e = inputMap.get(id);
    if (!e || !isContainer(e.type)) return;
    if (isArrayType(e.type) || isSetType(e.type))
      e.value.forEach((c: number) => mark(c));
    else if (isDictType(e.type))
      Object.values(e.value).forEach((c) => mark(c as number));
    else if (isObjectType(e.type))
      Object.values(e.value).forEach((c) => mark(c as number));
  }

  for (const frame of inputFrames)
    Object.values(frame.value as Record<string, number>).forEach((id) =>
      mark(id)
    );

  for (const e of model)
    if (e.id !== null && !reachable.has(e.id) && !answerMap.has(e.id))
      errors.push({
        type: ErrorType.ORPHANED_ELEMENT,
        message: `Unmapped box: id=${e.id}`,
        elementId: e.id,
        severity: 'error'
      });
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
    errors.push({
      type: ErrorType.ORPHANED_ELEMENT,
      message: `Unmapped ID: ${path}`,
      path,
      severity: 'error'
    });
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

  // Object type box check
  if (isObjectType(answerMemoryBox.type)) {
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

// Check if the call stack order matches between answer and input
function checkCallStackOrder(
  answerFrames: MemoryBox[],
  inputFrames: MemoryBox[],
  errors: FeedbackError[]
) {
  // The arrays come from gatherFrames and preserve the order
  if (answerFrames.length !== inputFrames.length) return; // size already handled
  for (let i = 0; i < answerFrames.length; i++) {
    if (answerFrames[i].name !== inputFrames[i].name) {
      errors.push({
        type: ErrorType.CALL_STACK_ORDER,
        message: "Function order mismatch: call stack order differs from expected",
        severity: 'error'
      });
      break;
    }
  }
}

async function fetchAnswerModel(
  questionType: "test" | "practice",
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

/* ---------- main validation function ---------- */
export default async function validateAnswer(
  userModel: MemoryBox[],
  questionId: number,
  questionType: "test" | "practice"
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
        message: `Invalid question id: ${questionId}`,
        severity: 'error'
      }],
    };
  }

  const errors: FeedbackError[] = [];

  // gather frames from both models
  const { answerFrames, inputFrames, ansByName, usrByName } = gatherFrames(
    answerModel,
    userModel,
    errors
  );

  // check for function + function call stack errors
  const hasFunctionErrors = errors.some(
    (e) =>
      e.message.startsWith("Function count mismatch") ||
      e.message.startsWith("Missing function") ||
      e.message.startsWith("Unexpected function")
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
    ansByName,
    usrByName,
    answerMap,
    inputMap,
    globalAnswerToInput,
    globalInputToAnswer,
    dup,
    errors
  );

  // detect orphans in the user model
  detectOrphans(inputFrames, inputMap, userModel, answerMap, errors);

  return { correct: errors.length === 0, errors };
}
