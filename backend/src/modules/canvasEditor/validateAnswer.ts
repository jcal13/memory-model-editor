import questions from "./questions";

type MemoryEntry = {
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

const idMap = (m: MemoryEntry[]) =>
  new Map(m.filter((e) => e.id !== null).map((e) => [e.id as number, e]));

/* ---------- recursive comparison ---------- */
function compareIds(
  corId: number,
  usrId: number,
  corMap: Map<number, MemoryEntry>,
  usrMap: Map<number, MemoryEntry>,
  c2u: Map<number, number>,
  u2c: Map<number, number>,
  duplicates: Set<number>,
  path: string,
  errors: string[],
  visited: Set<string>
) {
  if (duplicates.has(usrId)) return; // ignore duplicate boxes
  const k = `${corId}|${usrId}`;
  if (visited.has(k)) return;
  visited.add(k);

  const cor = corMap.get(corId);
  const usr = usrMap.get(usrId);
  if (!cor || !usr) {
    errors.push(`${path} unmapped ID`);
    return;
  }

  /* one-to-one ID mapping */
  if (c2u.has(corId) && c2u.get(corId) !== usrId) {
    errors.push(`${path}expected ID ${c2u.get(corId)}, now ${usrId}`);
    return;
  }
  if (u2c.has(usrId) && u2c.get(usrId) !== corId) {
    errors.push(`${path}expected ID ${u2c.get(usrId)}, now ${corId}`);
    return;
  }
  c2u.set(corId, usrId);
  u2c.set(usrId, corId);

  /* type check */
  if (cor.type !== usr.type) {
    errors.push(`${path}type mismatch: got ${usr.type}, expected ${cor.type}`);
    return;
  }

  /* primitive */
  if (!isContainer(cor.type)) {
    if (cor.value !== usr.value)
      errors.push(
        `${path}value mismatch: got ${usr.value}, expected ${cor.value}`
      );
    return;
  }

  /* list / tuple */
  if (isArrayType(cor.type)) {
    if (cor.value.length !== usr.value.length) {
      errors.push(`${path}length mismatch`);
      return;
    }
    cor.value.forEach((cChild: number, i: number) =>
      compareIds(
        cChild,
        usr.value[i],
        corMap,
        usrMap,
        c2u,
        u2c,
        duplicates,
        `${path}[${i}]→`,
        errors,
        visited
      )
    );
    return;
  }

  /* set */
  if (isSetType(cor.type)) {
    const unmatched = new Set(usr.value);
    for (const cChild of cor.value) {
      let matched = false;
      for (const uChild of Array.from(unmatched)) {
        const sub: string[] = [];
        compareIds(
          cChild,
          uChild as number,
          corMap,
          usrMap,
          new Map(c2u),
          new Map(u2c),
          duplicates,
          `${path}{el}→`,
          sub,
          new Set(visited)
        );
        if (sub.length === 0) {
          unmatched.delete(uChild);
          matched = true;
          break;
        }
      }
      if (!matched) errors.push(`${path}missing set element`);
    }
    if (unmatched.size) errors.push(`${path}extra set element(s)`);
    return;
  }

  /* dict */
  if (isDictType(cor.type)) {
    const cKeys = Object.keys(cor.value);
    const uKeys = Object.keys(usr.value);
    if (cKeys.length !== uKeys.length) errors.push(`${path}dict size mismatch`);
    for (const k of cKeys) {
      if (!(k in usr.value)) {
        errors.push(`${path}missing key "${k}"`);
        continue;
      }
      compareIds(
        cor.value[k],
        usr.value[k],
        corMap,
        usrMap,
        c2u,
        u2c,
        duplicates,
        `${path}[${k}]→`,
        errors,
        visited
      );
    }
  }
}

/* ---------- public ---------- */
export function validateAnswerDetailed(userModel: MemoryEntry[]) {
  const correctModel = questions[4].answer; // adjust index as needed
  const corFrame = correctModel.find((e) => e.type === ".frame");
  const usrFrame = userModel.find((e) => e.type === ".frame");
  if (!corFrame || !usrFrame)
    return { correct: false, errors: ["missing .frame entry"] };

  const errors: string[] = [];

  /* duplicate-ID scan */
  const dup = new Set<number>();
  const seen: Record<number, boolean> = {};
  for (const e of userModel)
    if (e.id !== null) {
      if (seen[e.id]) dup.add(e.id);
      else seen[e.id] = true;
    }
  dup.forEach((id) => errors.push(`duplicate ID ${id} detected`));

  /* frame name check */
  if (corFrame.name !== usrFrame.name) {
    errors.push(
      `frame name mismatch: got "${usrFrame.name}", expected "${corFrame.name}"`
    );
    return { correct: false, errors };
  }

  const corVars = corFrame.value as Record<string, number>;
  const usrVars = usrFrame.value as Record<string, number>;

  for (const k of Object.keys(corVars))
    if (!(k in usrVars)) errors.push(`missing variable "${k}" in frame`);
  for (const k of Object.keys(usrVars))
    if (!(k in corVars)) errors.push(`unexpected variable "${k}" in frame`);

  const corMap = idMap(correctModel);
  const usrMap = idMap(userModel);

  /* validate each variable with an independent mapping */
  for (const k of Object.keys(corVars)) {
    if (!(k in usrVars)) continue;

    const localC2U = new Map<number, number>();
    const localU2C = new Map<number, number>();

    compareIds(
      corVars[k],
      usrVars[k],
      corMap,
      usrMap,
      localC2U,
      localU2C,
      dup,
      `var "${k}"→`,
      errors,
      new Set()
    );
  }

  /* orphan box detection */
  (function detectOrphans() {
    const reachable = new Set<number>();
    function mark(id: number) {
      if (reachable.has(id)) return;
      reachable.add(id);
      const e = usrMap.get(id);
      if (!e || !isContainer(e.type)) return;
      if (isArrayType(e.type) || isSetType(e.type))
        e.value.forEach((c: number) => mark(c));
      else if (isDictType(e.type))
        Object.values(e.value).forEach((c) => mark(c as number));
    }
    Object.values(usrVars).forEach((id) => mark(id));
    for (const e of userModel)
      if (e.id !== null && !reachable.has(e.id))
        errors.push(`unnecessary box with id=${e.id}`);
  })();

  return { correct: errors.length === 0, errors };
}
