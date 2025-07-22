const questions = {
  1: {
    // basic assignment demo
    question:
      "This code assigns a to 5. b to 4. c to 6. Draw the memory model after the assignments complete.",
    code: ["a = 5", "b = 4", "c = 6"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 1, b: 2, c: 3 },
        order: 1,
      },
      { type: "int", id: 1, value: 5 },
      { type: "int", id: 2, value: 4 },
      { type: "int", id: 3, value: 6 },
    ],
  },

  2: {
    // computed value and list aliasing
    question:
      "This code stores a as 5. b becomes a plus 3. c is a list containing a three times. Draw the memory model right after c is created.",
    code: ["a = 5", "b = a + 3", "c = [a, a, a]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 1, b: 2, c: 3 },
        order: 1,
      },
      { type: "int", id: 1, value: 5 },
      { type: "int", id: 2, value: 8 },
      { type: "list", id: 3, value: [1, 1, 1] },
    ],
  },

  3: {
    // triple nesting list
    question:
      "The variable b becomes a triple nested list that ultimately holds a. Draw the memory model after b is assigned.",
    code: ["a = 5", "b = [[[a]]]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 1, b: 4 },
        order: 1,
      },
      { type: "int", id: 1, value: 5 },
      { type: "list", id: 2, value: [1] },
      { type: "list", id: 3, value: [2] },
      { type: "list", id: 4, value: [3] },
    ],
  },

  4: {
    // list concatenation makes a brand‑new list
    question:
      "x holds a list. y first aliases x then y is rebound to the concatenation result creating a new list. Draw the memory model after the concatenation.",
    code: ["x = [1, 2, 3]", "y = x", "y = y + [4]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { x: 5, y: 6 },
        order: 1,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "list", id: 5, value: [1, 2, 3] },
      { type: "list", id: 6, value: [1, 2, 3, 4] },
    ],
  },

  5: {
    // set alias then mutate
    question:
      "Both x and y refer to the same set. y adds 4 which mutates the shared set. Draw the memory model right after the mutation.",
    code: ["x = {1, 2, 3}", "y = x", "set.add(y, 4)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { x: 5, y: 6 },
        order: 1,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "list", id: 5, value: [1, 2, 3, 4] },
    ],
  },

  6: {
    // append inside loop
    question:
      "A nested list lst is mutated inside a loop by appending 88 to every inner list. Draw the memory model once the loop is finished.",
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
        inactive: false,
        value: { lst: 5, item: 7 },
        order: 1,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "int", id: 8, value: 88 },
      { type: "list", id: 5, value: [6, 7] },
      { type: "list", id: 6, value: [1, 2, 8] },
      { type: "list", id: 7, value: [3, 4, 8] },
    ],
  },

  7: {
    // simple alias no mutation
    question:
      "List a is created and b is an alias. No mutations happen. Draw the resulting memory model.",
    code: ["a = [1]", "b = a"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 2, b: 3 },
        order: 1,
      },
      { type: "int", id: 1, value: 1 },
      { type: "list", id: 2, value: [1] },
      { type: "list", id: 3, value: [1] },
    ],
  },

  8: {
    // two distinct empties
    question:
      "Two independent empty lists a and b are created. Draw the memory model immediately after creation.",
    code: ["a = []", "b = []"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 1, b: 2 },
        order: 1,
      },
      { type: "list", id: 1, value: [] },
      { type: "list", id: 2, value: [] },
    ],
  },

  9: {
    // rebound integer
    question:
      "n2 aliases n which starts at fourteen then n is rebound to fifteen. Draw the memory model after rebinding.",
    code: ["n = 14", "n2 = n", "n = 15"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { n: 2, n2: 1 },
        order: 1,
      },
      { type: "int", id: 1, value: 14 },
      { type: "int", id: 2, value: 15 },
    ],
  },

  10: {
    // string slicing makes new object
    question:
      "s2 aliases string s then s is sliced from index two onward creating a new string object. Draw the memory model after slicing.",
    code: ['s = "hello"', "s2 = s", "s = s[2:]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { s: 2, s2: 1 },
        order: 1,
      },
      { type: "str", id: 1, value: "hello" },
      { type: "str", id: 2, value: "llo" },
    ],
  },

  11: {
    // slice list into a new list
    question:
      "one aliases two then one is rebound to a slice from index one to three leaving two unchanged. Draw the memory model after slicing.",
    code: ["one = [0, 1, 2, 3, 4]", "two = one", "one = one[1:3]"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { one: 7, two: 6 },
        order: 1,
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
    // remove mutates one copy only
    question:
      "Two independent lists a and b are equal initially then a removes the first occurrence of two. Draw the memory model after the removal.",
    code: ["a = [1, 2, 3, 2, 9]", "b = [1, 2, 3, 2, 9]", "a.remove(2)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 6, b: 7 },
        order: 1,
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
    // alias then mutate index
    question:
      "Lists x and y alias the same object then the element at index one is changed to one hundred. Draw the resulting memory model.",
    code: ["x = [1, 2, 3]", "y = x", "y[1] = 100"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { x: 5, y: 5 },
        order: 1,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 100 },
      { type: "list", id: 5, value: [1, 4, 3] },
    ],
  },

  14: {
    // append mutates both aliases
    question:
      "lst and lst2 are aliases then lst appends ninety nine mutating the shared list. Draw the memory model afterward.",
    code: ["lst = [3, 2, 7]", "lst2 = lst", "lst.append(99)"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { lst: 5, lst2: 5 },
        order: 1,
      },
      { type: "int", id: 1, value: 3 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 7 },
      { type: "int", id: 4, value: 99 },
      { type: "list", id: 5, value: [1, 2, 3, 4] },
    ],
  },

  15: {
    // list inside list with later mutation and rebound
    question:
      "A temp list is inside L alongside a string and an int. temp is mutated and other is rebound to zero leaving L unchanged. Draw the memory model at this point.",
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
        inactive: false,
        value: { temp: 8, other: 6, L: 9 },
        order: 1,
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
    // item reassignment does not mutate outer list
    question:
      "Loop variable item is rebound to eighty eight but the inner lists remain unchanged. Draw the memory model after the loop.",
    code: ["L = [[1, 2], [3, 4]]", "for item in L:", "    item = 88"],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { L: 8 },
        order: 1,
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
