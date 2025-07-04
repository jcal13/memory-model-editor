import questions from "./questions";

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
const isContainer = (t: string) =>
  isArrayType(t) || isSetType(t) || isDictType(t);

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
  errors: string[]
): boolean {
  // check if the answer ID is already mapped to an input ID
  if (answerToInputMap.has(answerID)) {
    const prev = answerToInputMap.get(answerID)!;
    if (prev.target !== inputID) {
      if (!isVar) errors.push(`ID mapping conflict: ${prev.path}", "${path}`);
      return true;
    }
  }

  // check if the input ID is already mapped to an answer ID
  if (inputToAnswerMap.has(inputID)) {
    const prev = inputToAnswerMap.get(inputID)!;
    if (prev.target !== answerID) {
      if (!isVar) errors.push(`ID mapping conflict: ${prev.path}, ${path}`);
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
  errors: string[]
): boolean {
  if (answerBox.type !== inputBox.type) {
    errors.push(
      `Type mismatch: ${path} got ${inputBox.type}, expected ${answerBox.type}`
    );
    return true;
  }
  return false;
}

// Check if the answer box is a primitive type and compare values
function comparePrimitives(
  answerBox: MemoryBox,
  inputBox: MemoryBox,
  path: string,
  errors: string[]
): boolean {
  if (!isContainer(answerBox.type)) {
    if (answerBox.value !== inputBox.value) {
      errors.push(
        `Value mismatch: ${path} got ${inputBox.value}, expected ${answerBox.value}`
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
  errors: string[],
  visited: Map<number, Set<number>>
) {
  // first check if the lengths match
  const expectedLen = answerMemoryBox.value.length;
  const actualLen = inputMemoryBox.value.length;

  // report exact missing / unexpected elements
  if (actualLen < expectedLen)
    for (let i = actualLen; i < expectedLen; i++)
      errors.push(
        `Missing element: ${path}[${i}] id=${answerMemoryBox.value[i]}`
      );

  if (actualLen > expectedLen)
    for (let j = expectedLen; j < actualLen; j++)
      errors.push(
        `Unexpected element: ${path}[${j}] id=${inputMemoryBox.value[j]}`
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
      visited
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
  errors: string[],
  visited: Map<number, Set<number>>
) {
  // we create a set of all IDs in the input set (we consider they are all initially unmatched),
  // then check to see if all IDs in the answer set can be matched with an ID in the input set
  const unmatched = new Set(inputMemoryBox.value); // a set of unmatched input IDs
  for (const answerChild of answerMemoryBox.value) {
    let matched = false;
    for (const inputChild of Array.from(unmatched)) {
      const errorsDetected: string[] = [];
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
        clonedVisited
      );
      if (errorsDetected.length === 0) {
        // after recursive comparison, if no errors were detected, there is a match for the current input ID in the set
        unmatched.delete(inputChild);
        matched = true;
        break;
      }
    }
    if (!matched) errors.push(`Missing element: ${path} id=${answerChild}`);
  }

  // any IDs still in unmatched are unexpected extras supplied by the user
  for (const extraId of unmatched)
    errors.push(`Unexpected element: ${path} id=${extraId}`);
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
  errors: string[],
  visited: Map<number, Set<number>>
) {
  // iterate over every key expected by the answer
  for (const key of Object.keys(answerMemoryBox.value)) {
    if (!(key in inputMemoryBox.value)) {
      // key missing entirely in the user dict
      const missingId = answerMemoryBox.value[key];
      errors.push(`Missing key: ${path} key=${key}, id=${missingId}`);
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
      visited
    );
  }

  // after looping expected keys, look for any keys that exist in the input dict only
  for (const key of Object.keys(inputMemoryBox.value)) {
    if (!(key in answerMemoryBox.value)) {
      const extraId = inputMemoryBox.value[key];
      errors.push(`Unexpected key: ${path} key=${key}, id=${extraId}`);
    }
  }
}

// Gather frames from the answer and input models, checking for mismatches
function gatherFrames(
  answerModel: MemoryBox[],
  inputModel: MemoryBox[],
  errors: string[]
) {
  const answerFrames = answerModel.filter((e) => e.type === ".frame");
  const inputFrames = inputModel.filter((e) => e.type === ".frame");

  if (answerFrames.length !== inputFrames.length)
    errors.push(
      `Function count mismatch: expected ${answerFrames.length}, got ${inputFrames.length}`
    );

  const ansByName = new Map(answerFrames.map((f) => [f.name!, f]));
  const usrByName = new Map(inputFrames.map((f) => [f.name!, f]));

  for (const n of ansByName.keys())
    if (!usrByName.has(n)) errors.push(`Missing function: "${n}"`);
  for (const n of usrByName.keys())
    if (!ansByName.has(n)) errors.push(`Unexpected function: "${n}"`);

  return { answerFrames, inputFrames, ansByName, usrByName };
}

// Scan for duplicate IDs in the user model and report them
function scanDuplicates(model: MemoryBox[], errors: string[]): Set<number> {
  const dup = new Set<number>();
  const seen: Record<number, boolean> = {};
  for (const e of model)
    if (e.id !== null) {
      if (seen[e.id]) dup.add(e.id);
      else seen[e.id] = true;
    }
  dup.forEach((id) => errors.push(`Duplicate ID: ${id}`));
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
  errors: string[]
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
        errors.push(`Missing variable: function "${name}" expected "${k}"`);
    for (const k of Object.keys(uVars))
      if (!(k in aVars))
        errors.push(
          `Unexpected variable: function "${name}" unexpected "${k}"`
        );

    // deep comparison for shared variables
    for (const k of Object.keys(aVars)) {
      if (!(k in uVars)) continue;
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
        visited
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
  errors: string[]
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
  }

  for (const frame of inputFrames)
    Object.values(frame.value as Record<string, number>).forEach((id) =>
      mark(id)
    );

  for (const e of model)
    if (e.id !== null && !reachable.has(e.id) && !answerMap.has(e.id))
      errors.push(`Unmapped box: id=${e.id}`);
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
  errors: string[], // collects error messages
  visited: Map<number, Set<number>> // map of pairs: answerID → {inputID,…}
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
    errors.push(`Unmapped ID: ${path}`);
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
      errors
    )
  )
    return;

  // Type check
  if (checkTypeMismatch(answerMemoryBox, inputMemoryBox, path, errors)) return;

  // Primitive check
  if (comparePrimitives(answerMemoryBox, inputMemoryBox, path, errors)) return;

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
}

/* ---------- main validation function ---------- */
export default function validateAnswer(userModel: MemoryBox[]): {
  correct: boolean;
  errors: string[];
} {
  const answerModel = questions[1].answer; // adjust index as needed
  const errors: string[] = [];

  // gather frames from both models
  const { answerFrames, inputFrames, ansByName, usrByName } = gatherFrames(
    answerModel,
    userModel,
    errors
  );

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

  // detect duplicates in the user model
  detectOrphans(inputFrames, inputMap, userModel, answerMap, errors);

  return { correct: errors.length === 0, errors };
}
