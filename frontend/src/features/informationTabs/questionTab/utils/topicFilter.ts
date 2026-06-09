export function deriveAllTopics(topicMap: Map<number, string[]>): string[] {
  const topicSet = new Set<string>();
  topicMap.forEach((topics) => topics.forEach((t) => topicSet.add(t)));
  return Array.from(topicSet).sort();
}

export function filterQuestionIds(
  topicMap: Map<number, string[]>,
  questionCount: number,
  selectedTopic: string | null,
): number[] {
  if (selectedTopic === null) {
    return Array.from({ length: questionCount }, (_, i) => i + 1);
  }
  return Array.from(topicMap.entries())
    .filter(([, topics]) => topics.includes(selectedTopic))
    .map(([id]) => id)
    .sort((a, b) => a - b);
}
