const questions = {
  1: {
    code: ["a = 5", "b = 4", "c = 6"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          a: 1,
          b: 2,
          c: 3,
        },
      },
      {
        type: "int",
        id: 1,
        value: 5,
      },
      {
        type: "int",
        id: 2,
        value: 4,
      },
      {
        type: "int",
        id: 3,
        value: 6,
      },
    ],
  },
  2: {
    code: ["a = 5", "b = a + 3", "c = [a, a, a]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          a: 1,
          b: 2,
          c: 3,
        },
      },
      {
        type: "int",
        id: 1,
        value: 5,
      },
      {
        type: "int",
        id: 2,
        value: 8,
      },
      {
        type: "list",
        id: 3,
        value: [1, 1, 1],
      },
    ],
  },
  3: {
    code: ["a = 5", "b = [[[a]]]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          a: 1,
          b: 4,
        },
      },
      {
        type: "int",
        id: 1,
        value: 5,
      },
      {
        type: "list",
        id: 2,
        value: [1],
      },
      {
        type: "list",
        id: 3,
        value: [2],
      },
      {
        type: "list",
        id: 4,
        value: [3],
      },
    ],
  },
  4: {
    code: ["x = [1, 2, 3]", "y = x", "y = y + [4]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          x: 5,
          y: 6,
        },
      },
      {
        type: "int",
        id: 1,
        value: 1,
      },
      {
        type: "int",
        id: 2,
        value: 2,
      },
      {
        type: "int",
        id: 3,
        value: 3,
      },
      {
        type: "int",
        id: 4,
        value: 4,
      },
      {
        type: "list",
        id: 5,
        value: [1, 2, 3],
      },
      {
        type: "list",
        id: 6,
        value: [1, 2, 3, 4],
      },
    ],
  },
  5: {
    code: ["x = {1, 2, 3}", "y = x", "set.add(y, 4)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          x: 5,
          y: 6,
        },
      },
      {
        type: "int",
        id: 1,
        value: 1,
      },
      {
        type: "int",
        id: 2,
        value: 2,
      },
      {
        type: "int",
        id: 3,
        value: 3,
      },
      {
        type: "int",
        id: 4,
        value: 4,
      },
      {
        type: "list",
        id: 5,
        value: [1, 2, 3, 4],
      },
    ],
  },
  6: {
    code: [
      "lst = [[1, 2], [3, 4]]",
      "for item in lst:",
      "    list.append(item, 88)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          lst: 5,
          item: 7,
        },
      },
      {
        type: "int",
        id: 1,
        value: 1,
      },
      {
        type: "int",
        id: 2,
        value: 2,
      },
      {
        type: "int",
        id: 3,
        value: 3,
      },
      {
        type: "int",
        id: 4,
        value: 4,
      },
      {
        type: "int",
        id: 8,
        value: 88,
      },
      {
        type: "list",
        id: 5,
        value: [6, 7],
      },
      {
        type: "list",
        id: 6,
        value: [1, 2, 8],
      },
      {
        type: "list",
        id: 7,
        value: [3, 4, 8],
      },
    ],
  },
  7: {
    code: ["a = [1]", "b = [1]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: {
          a: 2,
          b: 3,
        },
      },
      {
        type: "int",
        id: 1,
        value: 1,
      },
      {
        type: "list",
        id: 2,
        value: [1],
      },
      {
        type: "list",
        id: 3,
        value: [1],
      },
    ],
  },
};

export default questions;
