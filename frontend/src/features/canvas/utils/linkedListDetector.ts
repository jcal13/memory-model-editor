import { CanvasElement, ClassKind } from "../../shared/types";
import {
  createElementsByIdMap,
  formatPrimitiveValue,
  isPrimitiveElement,
} from "./pythonTutorReferences";

const PREFERRED_ROOT_LABELS = ["head", "first", "_first"];
const VALUE_ATTRIBUTE_NAMES = ["item", "value", "data", "val", "_value"];

export type LinkedListNextKind =
  | "node"
  | "none"
  | "missing"
  | "invalid"
  | "cycle";

export interface LinkedListNodeSnapshot {
  nodeId: number;
  className: string;
  value: string;
  labels: string[];
  nextTargetId: number | null;
  nextKind: LinkedListNextKind;
}

export interface LinkedListStructure {
  key: string;
  rootNodeId: number;
  className: string;
  nodes: LinkedListNodeSnapshot[];
  cycleTargetId: number | null;
}

export interface LinkedListDetectionResult {
  structures: LinkedListStructure[];
}

export interface LinkedListGraphNode {
  nodeId: number;
  className: string;
  value: string;
  labels: string[];
  nextKind: LinkedListNextKind;
  nextTargetId: number | null;
  group: number;
}

export interface LinkedListGraphEdge {
  fromId: number;
  toId: number;
}

export interface LinkedListGraph {
  nodes: LinkedListGraphNode[];
  edges: LinkedListGraphEdge[];
}

interface CandidateNode {
  nodeId: number;
  className: string;
  value: string;
  labels: string[];
  nextTargetId: number | null;
  nextKind: Exclude<LinkedListNextKind, "cycle">;
}

function isClassElement(
  element: CanvasElement | undefined
): element is CanvasElement & { kind: ClassKind } {
  return element?.kind.name === "class";
}

function hasNextAttribute(element: CanvasElement | undefined): boolean {
  return Boolean(
    isClassElement(element) &&
      element.kind.classVariables.some((attribute) => attribute.name === "next")
  );
}

function addLabel(
  labelMap: Map<number, Set<string>>,
  targetId: number | null,
  label: string
): void {
  if (targetId === null || !label.trim()) {
    return;
  }

  const existing = labelMap.get(targetId) ?? new Set<string>();
  existing.add(label);
  labelMap.set(targetId, existing);
}

function buildNodeLabelMap(elements: CanvasElement[]): Map<number, Set<string>> {
  const labelMap = new Map<number, Set<string>>();

  elements.forEach((element) => {
    if (element.kind.name === "function") {
      element.kind.params.forEach((param) => {
        addLabel(labelMap, param.targetId, param.name);
      });
      return;
    }

    if (element.kind.name === "class" && !hasNextAttribute(element)) {
      element.kind.classVariables.forEach((attribute) => {
        addLabel(labelMap, attribute.targetId, attribute.name);
      });
    }
  });

  return labelMap;
}

function formatReferenceValue(
  targetId: number | null,
  elementsById: Map<number, CanvasElement>
): string {
  if (targetId === null) {
    return "";
  }

  const target = elementsById.get(targetId);
  if (!target) {
    return "?";
  }

  if (isPrimitiveElement(target)) {
    return formatPrimitiveValue(target.kind);
  }

  if (typeof target.id === "number") {
    return `id${target.id}`;
  }

  return "?";
}

function resolveNodeValue(
  element: CanvasElement & { kind: ClassKind },
  elementsById: Map<number, CanvasElement>
): string {
  const attributes = element.kind.classVariables.filter(
    (attribute) => attribute.name !== "next"
  );

  for (const attributeName of VALUE_ATTRIBUTE_NAMES) {
    const match = attributes.find((attribute) => attribute.name === attributeName);
    if (match) {
      return formatReferenceValue(match.targetId, elementsById);
    }
  }

  for (const attribute of attributes) {
    const value = formatReferenceValue(attribute.targetId, elementsById);
    if (value) {
      return value;
    }
  }

  return element.kind.className || "value";
}

function resolveNextPointer(
  element: CanvasElement & { kind: ClassKind },
  elementsById: Map<number, CanvasElement>
): Pick<CandidateNode, "nextTargetId" | "nextKind"> | null {
  const nextAttribute = element.kind.classVariables.find(
    (attribute) => attribute.name === "next"
  );

  if (!nextAttribute) {
    return null;
  }

  if (nextAttribute.targetId === null) {
    return {
      nextTargetId: null,
      nextKind: "missing",
    };
  }

  const target = elementsById.get(nextAttribute.targetId);
  if (!target) {
    return {
      nextTargetId: nextAttribute.targetId,
      nextKind: "missing",
    };
  }

  if (isPrimitiveElement(target) && target.kind.type === "NoneType") {
    return {
      nextTargetId: null,
      nextKind: "none",
    };
  }

  if (
    isClassElement(target) &&
    hasNextAttribute(target) &&
    typeof target.id === "number"
  ) {
    return {
      nextTargetId: target.id,
      nextKind: "node",
    };
  }

  return {
    nextTargetId: typeof target.id === "number" ? target.id : nextAttribute.targetId,
    nextKind: "invalid",
  };
}

function buildCandidateMap(
  elements: CanvasElement[],
  elementsById: Map<number, CanvasElement>,
  labelMap: Map<number, Set<string>>
): Map<number, CandidateNode> {
  const candidateMap = new Map<number, CandidateNode>();

  elements.forEach((element) => {
    if (!isClassElement(element) || typeof element.id !== "number") {
      return;
    }

    const nextPointer = resolveNextPointer(element, elementsById);
    if (!nextPointer) {
      return;
    }

    if (nextPointer.nextKind === "invalid") {
      return;
    }

    candidateMap.set(element.id, {
      nodeId: element.id,
      className: element.kind.className || "Node",
      value: resolveNodeValue(element, elementsById),
      labels: Array.from(labelMap.get(element.id) ?? []),
      nextTargetId: nextPointer.nextTargetId,
      nextKind: nextPointer.nextKind,
    });
  });

  return candidateMap;
}

function getRootPriority(labels: string[]): number {
  const normalized = labels.map((label) => label.trim().toLowerCase());
  const priorityIndex = PREFERRED_ROOT_LABELS.findIndex((preferred) =>
    normalized.includes(preferred)
  );

  return priorityIndex === -1 ? Number.MAX_SAFE_INTEGER : priorityIndex;
}

function compareStartNodes(
  leftId: number,
  rightId: number,
  candidateMap: Map<number, CandidateNode>
): number {
  const left = candidateMap.get(leftId);
  const right = candidateMap.get(rightId);

  if (!left || !right) {
    return leftId - rightId;
  }

  const rootPriorityDifference =
    getRootPriority(left.labels) - getRootPriority(right.labels);
  if (rootPriorityDifference !== 0) {
    return rootPriorityDifference;
  }

  const labelCountDifference = right.labels.length - left.labels.length;
  if (labelCountDifference !== 0) {
    return labelCountDifference;
  }

  return leftId - rightId;
}

function traverseStructure(
  startId: number,
  candidateMap: Map<number, CandidateNode>
): LinkedListStructure | null {
  const start = candidateMap.get(startId);
  if (!start) {
    return null;
  }

  const visited = new Set<number>();
  const nodes: LinkedListNodeSnapshot[] = [];
  let currentId: number | null = startId;
  let cycleTargetId: number | null = null;

  while (currentId !== null) {
    const current = candidateMap.get(currentId);
    if (!current) {
      break;
    }

    visited.add(currentId);

    let nextKind: LinkedListNextKind = current.nextKind;
    const nextTargetId = current.nextTargetId;

    if (
      current.nextKind === "node" &&
      nextTargetId !== null &&
      visited.has(nextTargetId)
    ) {
      nextKind = "cycle";
      cycleTargetId = nextTargetId;
    }

    nodes.push({
      nodeId: current.nodeId,
      className: current.className,
      value: current.value,
      labels: current.labels,
      nextTargetId,
      nextKind,
    });

    if (nextKind !== "node" || nextTargetId === null) {
      break;
    }

    currentId = nextTargetId;
  }

  if (nodes.length === 0) {
    return null;
  }

  return {
    key: `${start.className}-${startId}`,
    rootNodeId: startId,
    className: start.className,
    nodes,
    cycleTargetId,
  };
}

export function detectLinkedLists(
  elements: CanvasElement[],
  elementsById: Map<number, CanvasElement> = createElementsByIdMap(elements)
): LinkedListDetectionResult {
  const labelMap = buildNodeLabelMap(elements);
  const candidateMap = buildCandidateMap(elements, elementsById, labelMap);

  if (candidateMap.size === 0) {
    return { structures: [] };
  }

  const incomingNextCounts = new Map<number, number>();
  candidateMap.forEach((candidate) => {
    incomingNextCounts.set(candidate.nodeId, 0);
  });

  candidateMap.forEach((candidate) => {
    if (candidate.nextKind !== "node" || candidate.nextTargetId === null) {
      return;
    }

    if (candidateMap.has(candidate.nextTargetId)) {
      incomingNextCounts.set(
        candidate.nextTargetId,
        (incomingNextCounts.get(candidate.nextTargetId) ?? 0) + 1
      );
    }
  });

  const orderedRoots = Array.from(candidateMap.keys())
    .filter((nodeId) => (incomingNextCounts.get(nodeId) ?? 0) === 0)
    .sort((left, right) => compareStartNodes(left, right, candidateMap));

  const coveredNodeIds = new Set<number>();
  const structures: LinkedListStructure[] = [];

  for (const rootId of orderedRoots) {
    if (coveredNodeIds.has(rootId)) {
      continue;
    }

    const structure = traverseStructure(rootId, candidateMap);
    if (!structure) {
      continue;
    }

    structure.nodes.forEach((node) => coveredNodeIds.add(node.nodeId));
    structures.push(structure);
  }

  const remainingStarts = Array.from(candidateMap.keys())
    .filter((nodeId) => !coveredNodeIds.has(nodeId))
    .sort((left, right) => compareStartNodes(left, right, candidateMap));

  for (const startId of remainingStarts) {
    const structure = traverseStructure(startId, candidateMap);
    if (!structure) {
      continue;
    }

    structure.nodes.forEach((node) => coveredNodeIds.add(node.nodeId));
    structures.push(structure);
  }

  return { structures };
}

export function detectLinkedListGraph(
  elements: CanvasElement[],
  elementsById: Map<number, CanvasElement> = createElementsByIdMap(elements)
): LinkedListGraph {
  const labelMap = buildNodeLabelMap(elements);
  const candidateMap = buildCandidateMap(elements, elementsById, labelMap);

  if (candidateMap.size === 0) {
    return { nodes: [], edges: [] };
  }

  const incoming = new Map<number, number>();

  candidateMap.forEach((candidate) => {
    incoming.set(candidate.nodeId, 0);
  });

  candidateMap.forEach((candidate) => {
    if (
      candidate.nextKind === "node" &&
      candidate.nextTargetId !== null &&
      candidateMap.has(candidate.nextTargetId)
    ) {
      incoming.set(
        candidate.nextTargetId,
        (incoming.get(candidate.nextTargetId) ?? 0) + 1
      );
    }
  });

  const ordered: number[] = [];
  const groupOf = new Map<number, number>();
  const seen = new Set<number>();
  let group = 0;
  const walk = (startId: number) => {
    let id: number | null = startId;
    let advanced = false;
    while (id !== null && candidateMap.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
      groupOf.set(id, group);
      advanced = true;
      const c: CandidateNode = candidateMap.get(id)!;
      id = c.nextKind === "node" ? c.nextTargetId : null;
    }
    if (advanced) group += 1;
  };
  Array.from(candidateMap.keys())
    .filter((id) => (incoming.get(id) ?? 0) === 0)
    .sort((a, b) => compareStartNodes(a, b, candidateMap))
    .forEach(walk);
  Array.from(candidateMap.keys())
    .sort((a, b) => compareStartNodes(a, b, candidateMap))
    .forEach(walk);

  const nodes: LinkedListGraphNode[] = ordered.map((id) => {
    const candidate = candidateMap.get(id)!;
    return {
      nodeId: candidate.nodeId,
      className: candidate.className,
      value: candidate.value,
      labels: candidate.labels,
      nextKind: candidate.nextKind,
      nextTargetId: candidate.nextTargetId,
      group: groupOf.get(id) ?? 0,
    };
  });

  const edges: LinkedListGraphEdge[] = [];

  candidateMap.forEach((candidate) => {
    if (
      candidate.nextKind === "node" &&
      candidate.nextTargetId !== null &&
      candidateMap.has(candidate.nextTargetId)
    ) {
      edges.push({
        fromId: candidate.nodeId,
        toId: candidate.nextTargetId,
      });
    }
  });

  return {
    nodes,
    edges,
  };
}