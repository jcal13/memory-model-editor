import { deriveAllTopics, filterQuestionIds } from "./topicFilter";

describe("deriveAllTopics", () => {
  it("returns an empty array when the map is empty", () => {
    expect(deriveAllTopics(new Map())).toEqual([]);
  });

  it("returns sorted unique topics across all questions", () => {
    const topicMap = new Map([
      [1, ["Recursion", "Lists"]],
      [2, ["Linked Lists"]],
      [3, ["Recursion"]],
    ]);
    expect(deriveAllTopics(topicMap)).toEqual(["Linked Lists", "Lists", "Recursion"]);
  });

  it("deduplicates topics that appear on multiple questions", () => {
    const topicMap = new Map([
      [1, ["Trees", "Recursion"]],
      [2, ["Trees"]],
    ]);
    expect(deriveAllTopics(topicMap)).toEqual(["Recursion", "Trees"]);
  });

  it("handles questions with empty topic arrays", () => {
    const topicMap = new Map([
      [1, []],
      [2, ["Stacks"]],
      [3, []],
    ]);
    expect(deriveAllTopics(topicMap)).toEqual(["Stacks"]);
  });
});

describe("filterQuestionIds", () => {
  const topicMap = new Map([
    [1, ["Recursion", "Lists"]],
    [2, ["Linked Lists"]],
    [3, ["Recursion"]],
    [4, ["Trees"]],
  ]);

  it("returns all IDs 1..questionCount when selectedTopic is null", () => {
    expect(filterQuestionIds(topicMap, 4, null)).toEqual([1, 2, 3, 4]);
  });

  it("returns IDs in ascending order when filtering by topic", () => {
    expect(filterQuestionIds(topicMap, 4, "Recursion")).toEqual([1, 3]);
  });

  it("returns only the matching ID when one question has the topic", () => {
    expect(filterQuestionIds(topicMap, 4, "Linked Lists")).toEqual([2]);
  });

  it("returns an empty array when no questions match the topic", () => {
    expect(filterQuestionIds(topicMap, 4, "Sorting")).toEqual([]);
  });

  it("ignores questionCount when a topic is selected", () => {
    // questionCount=10 but only 2 questions in topicMap have Recursion
    expect(filterQuestionIds(topicMap, 10, "Recursion")).toEqual([1, 3]);
  });
});
