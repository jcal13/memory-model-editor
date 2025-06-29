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
    code: ["a = [1]", "b = a"],
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
  8: {
    code: ["a = []", "b = []"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { a: 1, b: 2 },
      },
      { type: "list", id: 1, value: [] },
      { type: "list", id: 2, value: [] },
    ],
  },
  9: {
    code: ["n = 14", "n2 = n", "n = 15"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { n: 2, n2: 1 },
      },
      { type: "int", id: 1, value: 14 },
      { type: "int", id: 2, value: 15 },
    ],
  },
  10: {
    code: ['s = "hello"', "s2 = s", "s = s[2:]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { s: 2, s2: 1 },
      },
      { type: "str", id: 1, value: "hello" },
      { type: "str", id: 2, value: "llo" },
    ],
  },
  11: {
    code: ["one = [0, 1, 2, 3, 4]", "two = one", "one = one[1:3]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { one: 7, two: 6 },
      },
      { type: "int", id: 1, value: 0 },
      { type: "int", id: 2, value: 1 },
      { type: "int", id: 3, value: 2 },
      { type: "int", id: 4, value: 3 },
      { type: "int", id: 5, value: 4 },
      { type: "list", id: 6, value: [1, 2, 3, 4, 5] },
      { type: "list", id: 7, value: [2, 3] },
    ],
  },
  12: {
    code: ["a = [1, 2, 3, 2, 9]", "b = [1, 2, 3, 2, 9]", "a.remove(2)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { a: 6, b: 7 },
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 9 },
      { type: "list", id: 6, value: [1, 3, 2, 4] },
      { type: "list", id: 7, value: [1, 2, 3, 2, 4] },
    ],
  },
  13: {
    code: ["x = [1, 2, 3]", "y = x", "y[1] = 100"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { x: 5, y: 5 },
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 100 },
      { type: "list", id: 5, value: [1, 4, 3] },
    ],
  },
  14: {
    code: ["lst = [3, 2, 7]", "lst2 = lst", "lst.append(99)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { lst: 5, lst2: 5 },
      },
      { type: "int", id: 1, value: 3 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 7 },
      { type: "int", id: 4, value: 99 },
      { type: "list", id: 5, value: [1, 2, 3, 4] },
    ],
  },
  15: {
    code: [
      "temp = [5, 10, 15]",
      "other = 75",
      "L = [temp, 'hey', other]",
      "temp[1] = 99",
      "other = 0",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { temp: 8, other: 6, L: 9 },
      },
      { type: "int", id: 1, value: 5 },
      { type: "int", id: 2, value: 10 },
      { type: "int", id: 3, value: 15 },
      { type: "int", id: 4, value: 99 },
      { type: "int", id: 5, value: 75 },
      { type: "int", id: 6, value: 0 },
      { type: "str", id: 7, value: "hey" },
      { type: "list", id: 8, value: [1, 4, 3] },
      { type: "list", id: 9, value: [8, 7, 5] },
    ],
  },
  16: {
    code: ["L = [[1, 2], [3, 4]]", "for item in L:", "    item = 88"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        value: { L: 8 },
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "int", id: 5, value: 88 },
      { type: "list", id: 6, value: [1, 2] },
      { type: "list", id: 7, value: [3, 4] },
      { type: "list", id: 8, value: [6, 7] },
    ],
  },
};

export default questions;
