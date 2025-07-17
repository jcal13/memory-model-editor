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

  /* ---------------- test questions ---------------- */
  // 2023 midterm 1
  17: {
    question:
      "A Fries object calls Food update_price through inheritance. Draw the memory model before update_price returns.",
    code: [
      "class Food:",
      "    def __init__(self, n: str, p: int) -> None:",
      "        self.name = n",
      "        self.price = p",
      "",
      "    def update_price(self, new_price: int) -> None:",
      '        """Update this Food’s price to new_price."""',
      "        price = self.price",
      "        price = new_price",
      "",
      "class Fries(Food):",
      "    def __init__(self, p: int) -> None:",
      "        Food.__init__(self, 'fries', p)",
      "",
      "class Menu:",
      "    def __init__(self, items: list[Food]) -> None:",
      "        self.items = items",
      "",
      "if __name__ == '__main__':",
      "    f = Fries(5)",
      "    menu = Menu([f])",
      "    f.update_price(7)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { f: 4, menu: 5 },
        order: 1,
      },
      {
        type: ".frame",
        name: "Fries.__init__",
        id: null,
        inactive: true,
        value: { self: 4, p: 2 },
        order: 2,
      },
      {
        type: ".frame",
        name: "Food.__init__",
        id: null,
        inactive: true,
        value: { self: 4, n: 1, p: 2 },
        order: 3,
      },
      {
        type: ".frame",
        name: "Menu.__init__",
        id: null,
        inactive: true,
        value: { self: 5, items: 6 },
        order: 4,
      },
      {
        type: ".frame",
        name: "Food.update_price",
        id: null,
        inactive: false,
        value: { self: 4, new_price: 3, price: 3 },
        order: 5,
      },
      { type: "str", id: 1, value: "fries" },
      { type: "int", id: 2, value: 5 },
      { type: "int", id: 3, value: 7 },
      { type: "object", id: 4, value: { name: 1, price: 2 } },
      { type: "list", id: 6, value: [4] },
      { type: "object", id: 5, value: { items: 6 } },
    ],
  },

  // 2024 final
  18: {
    question:
      "This recursive constructor builds a RecursiveList for 7 and hi. Draw every function and object created during execution of main.",
    code: [
      "class RecursiveList:",
      "    def __init__(self, items: list) -> None:",
      "        if items == []:",
      "            self._first, self._rest = None, None",
      "            return",
      "        self._first = items[0]",
      "        self._rest = RecursiveList(items[1:])",
      "",
      "if __name__ == '__main__':",
      "    rec_lst = RecursiveList([7, 'hi'])",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { rec_lst: 10 },
        order: 1,
      },
      {
        type: ".frame",
        name: "RecursiveList.__init__",
        id: null,
        inactive: false,
        value: { self: 10, items: 11 },
        order: 2,
      },
      {
        type: ".frame",
        name: "RecursiveList.__init__",
        id: null,
        inactive: false,
        value: { self: 20, items: 22 },
        order: 3,
      },
      {
        type: ".frame",
        name: "RecursiveList.__init__",
        id: null,
        inactive: false,
        value: { self: 30, items: 33 },
        order: 4,
      },
      { type: "int", id: 1, value: 7 },
      { type: "str", id: 2, value: "hi" },
      { type: "None", id: 6, value: null },
      { type: "list", id: 11, value: [1, 2] },
      { type: "list", id: 22, value: [2] },
      { type: "list", id: 33, value: [] },
      { type: "object", id: 10, value: { _first: 1, _rest: 20 } },
      { type: "object", id: 20, value: { _first: 2, _rest: 30 } },
      { type: "object", id: 30, value: { _first: 6, _rest: 6 } },
    ],
  },

  // 2024 midterm 1
  19: {
    question:
      "Nested helper functions append v plus one to a shared list then return. Draw the memory model before a_fun returns.",
    code: [
      "def a_fun(lst: list[int], v: int) -> None:",
      "    x = v + 1",
      "    lst.append(x)",
      "",
      "def y_fun(d: list[int]) -> int:",
      "    a_fun(d, 3)",
      "    return d[-1]",
      "",
      "def have_fun(lst: list[int]) -> int:",
      "    return y_fun(lst)",
      "",
      "if __name__ == '__main__':",
      "    a = [1, 2, 3]",
      "    b = a",
      "    print(have_fun(a))",
      "    print(b)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { a: 148, b: 148 },
        order: 1,
      },
      {
        type: ".frame",
        name: "have_fun",
        id: null,
        inactive: false,
        value: { lst: 148 },
        order: 2,
      },
      {
        type: ".frame",
        name: "y_fun",
        id: null,
        inactive: false,
        value: { d: 148 },
        order: 3,
      },
      {
        type: ".frame",
        name: "a_fun",
        id: null,
        inactive: false,
        value: { lst: 148, v: 3, x: 4 },
        order: 4,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "list", id: 148, value: [1, 2, 3, 4] },
    ],
  },

  // 2017 final
  20: {
    question:
      "duplicate makes a shallow copy of an outer matrix list. Draw the memory model after duplicate returns to main.",
    code: [
      "def duplicate(matrix: list[list[int]]) -> list[list[int]]:",
      "    answer = []",
      "    for item in matrix:",
      "        answer.append(item)",
      "    return answer",
      "",
      "if __name__ == '__main__':",
      "    m1 = [[1, 2], [3, 4]]",
      "    m2 = duplicate(m1)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { m1: 101, m2: 104 },
        order: 1,
      },
      {
        type: ".frame",
        name: "duplicate",
        id: null,
        inactive: true,
        value: { matrix: 101, answer: 104 },
        order: 2,
      },
      { type: "int", id: 50, value: 1 },
      { type: "int", id: 60, value: 2 },
      { type: "int", id: 70, value: 3 },
      { type: "int", id: 80, value: 4 },
      { type: "list", id: 102, value: [50, 60] },
      { type: "list", id: 103, value: [70, 80] },
      { type: "list", id: 101, value: [102, 103] },
      { type: "list", id: 104, value: [102, 103] },
    ],
  },

  // 2017 midterm 1
  21: {
    question:
      "filter_queue removes values below minimum and reassigns q inside the function. Draw the memory model just before filter_queue returns.",
    code: [
      "def filter_queue(q: Queue[int], minimum: int) -> None:",
      '    """Remove all items from <q> that are less than <minimum>."""',
      "    temp_queue = Queue()",
      "    while not q.is_empty():",
      "        value = q.dequeue()",
      "        if value >= minimum:",
      "            temp_queue.enqueue(value)",
      "    q = temp_queue",
      "",
      "if __name__ == '__main__':",
      "    q = Queue()",
      "    q.enqueue(2)",
      "    q.enqueue(21)",
      "    q.enqueue(5)",
      "    q.enqueue(1)",
      "    filter_queue(q, 10)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { q: 90 },
        order: 1,
      },
      {
        type: ".frame",
        name: "filter_queue",
        id: null,
        inactive: false,
        value: { q: 95, minimum: 67, temp_queue: 95, value: 83 },
        order: 2,
      },
      { type: "int", id: 67, value: 10 },
      { type: "int", id: 80, value: 2 },
      { type: "int", id: 81, value: 21 },
      { type: "int", id: 82, value: 5 },
      { type: "int", id: 83, value: 1 },
      { type: "list", id: 100, value: [] },
      { type: "object", id: 90, value: { _items: 100 } },
      { type: "list", id: 105, value: [81] },
      { type: "object", id: 95, value: { _items: 105 } },
    ],
  },

  // 2018 midterm
  22: {
    question:
      "mystery aliases list via c mutates it then rebinds local b to a new list. Draw the memory model before mystery returns.",
    code: [
      "def mystery(a: int, b: list[int]) -> None:",
      "    c = b",
      "    c.append(a)",
      "    a = a + 1",
      "    b = [5]",
      "",
      "if __name__ == '__main__':",
      "    my_num = 100",
      "    my_lst = [7]",
      "    mystery(my_num, my_lst)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { my_num: 1, my_lst: 99 },
        order: 1,
      },
      {
        type: ".frame",
        name: "mystery",
        id: null,
        inactive: false,
        value: { a: 4, b: 100, c: 99 },
        order: 2,
      },
      { type: "int", id: 1, value: 100 },
      { type: "int", id: 2, value: 7 },
      { type: "int", id: 3, value: 5 },
      { type: "int", id: 4, value: 101 },
      { type: "list", id: 99, value: [2, 1] },
      { type: "list", id: 100, value: [3] },
    ],
  },

  // 2019 midterm 1
  23: {
    question:
      "copy_of builds a shallow copy of a tic tac toe board. Draw the memory model before copy_of returns.",
    code: [
      "from typing import Any, List",
      "",
      "def copy_of(lst: List[Any]) -> List[Any]:",
      "    new_lst: List[Any] = []",
      "    for item in lst:",
      "        new_lst.append(item)",
      "    return new_lst",
      "",
      "if __name__ == '__main__':",
      "    board = [['O', 'O', ''],",
      "             ['O', 'X', 'X'],",
      "             ['X', '', 'X']]",
      "    temp_board = copy_of(board)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { board: 100 },
        order: 1,
      },
      {
        type: ".frame",
        name: "copy_of",
        id: null,
        inactive: false,
        value: { lst: 100, new_lst: 200, item: 30 },
        order: 2,
      },
      { type: "str", id: 1, value: "O" },
      { type: "str", id: 2, value: "" },
      { type: "str", id: 3, value: "X" },
      { type: "list", id: 10, value: [1, 1, 2] },
      { type: "list", id: 20, value: [1, 3, 3] },
      { type: "list", id: 30, value: [3, 2, 3] },
      { type: "list", id: 100, value: [10, 20, 30] },
      { type: "list", id: 200, value: [10, 20, 30] },
    ],
  },

  // 2019 midterm 2
  24: {
    question:
      "append_sometimes appends two to sublists that lack it using aliasing. Draw the memory model before append_sometimes returns.",
    code: [
      "from typing import List",
      "",
      "def append_sometimes(lst: List[List[int]], new: int) -> List[List[int]]:",
      '    """Return a new list equal to <lst>, with <new> appended to each',
      '    sub‑list that doesn’t already contain it."""',
      "    answer = lst",
      "    for item in answer:",
      "        if new not in item:",
      "            item.append(new)",
      "    return answer",
      "",
      "if __name__ == '__main__':",
      "    lst1 = [[1, 2], [3], [4, 5]]",
      "    new_lst1 = append_sometimes(lst1, 2)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { lst1: 100 },
        order: 1,
      },
      {
        type: ".frame",
        name: "append_sometimes",
        id: null,
        inactive: false,
        value: { lst: 100, new: 2, answer: 100, item: 30 },
        order: 2,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "int", id: 5, value: 5 },
      { type: "list", id: 10, value: [1, 2] },
      { type: "list", id: 20, value: [3, 2] },
      { type: "list", id: 30, value: [4, 5, 2] },
      { type: "list", id: 100, value: [10, 20, 30] },
    ],
  },

  // 2019 midterm 3
  25: {
    question:
      "Two BagOfStuff objects share the same list which is mutated after the first construction. Draw the memory model before the assert executes.",
    code: [
      "class BagOfStuff:",
      "    def __init__(self, stuff: list[str]) -> None:",
      "        self.stuff = stuff",
      "",
      "if __name__ == '__main__':",
      "    some_stuff = ['wallet', 'phone', 'keys']",
      "    my_stuff = BagOfStuff(some_stuff)",
      "    some_stuff.append('snacks')",
      "    your_stuff = BagOfStuff(some_stuff)",
      "    assert len(my_stuff.stuff) == 3 and len(your_stuff.stuff) == 4",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { some_stuff: 10, my_stuff: 20, your_stuff: 30 },
        order: 1,
      },
      { type: "object", id: 20, value: { stuff: 10 } },
      { type: "object", id: 30, value: { stuff: 10 } },
      { type: "list", id: 10, value: [1, 2, 3, 4] },
      { type: "str", id: 1, value: "wallet" },
      { type: "str", id: 2, value: "phone" },
      { type: "str", id: 3, value: "keys" },
      { type: "str", id: 4, value: "snacks" },
    ],
  },

  // 2022 final
  26: {
    question:
      "do_something appends ninety nine to each inner list accessed through an alias. Draw the memory model after do_something is popped.",
    code: [
      "from typing import List",
      "",
      "def do_something(lst: List[List[int]]) -> None:",
      "    for sublst in lst:",
      "        sublst.append(99)",
      "",
      "if __name__ == '__main__':",
      "    original_lst = [[1, 2, 3], [4, 5, 6]]",
      "    lst_copy = [original_lst[0], original_lst[1]]",
      "    do_something(lst_copy)",
    ],
    answer: [
      {
        type: ".frame",
        name: "__main__",
        id: null,
        inactive: false,
        value: { original_lst: 30, lst_copy: 40 },
        order: 1,
      },
      {
        type: ".frame",
        name: "do_something",
        id: null,
        inactive: true,
        value: { lst: 40, sublst: 20 },
        order: 2,
      },
      { type: "int", id: 1, value: 1 },
      { type: "int", id: 2, value: 2 },
      { type: "int", id: 3, value: 3 },
      { type: "int", id: 4, value: 4 },
      { type: "int", id: 5, value: 5 },
      { type: "int", id: 6, value: 6 },
      { type: "int", id: 7, value: 99 },
      { type: "list", id: 10, value: [1, 2, 3, 7] },
      { type: "list", id: 20, value: [4, 5, 6, 7] },
      { type: "list", id: 30, value: [10, 20] },
      { type: "list", id: 40, value: [10, 20] },
    ],
  },
};

export default questions;
