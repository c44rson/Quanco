import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import {
  program,
  variableDeclaration,
  variable,
  binary,
  numType,
} from "../src/core.js";

const semanticChecks = [
  [
    "variable declarations",
    `readonly x: num
     y: str`,
  ],
  [
    "arithmetic",
    `x: num = 1 / 1 * 1 / 1 * 1
     y: num = 1 / 2 * -1
     z: num = x * y - x + y
     a: bool = true or false
     b: bool = true
     c: bool = a or b and a
     d: bool = x <= 1
     e: bool = 1 <= x
     f: none | bool = true or false or d
     `,
  ],
  [
    "if",
    `if 1 == 1 {
      x: num = 1
     } elif 1 == 2 {
      y: num = 2
     } elif 1 == 3 {
      z: num = 2
     }
    `,
  ],
  [
    "variable assignments",
    `readonly y: num = 0
     z: str | none = "0"
     w: none | str = "0"
     a: bool = false or true and true
     b: num = (0.0 - 1 * 5)
     c: none = none
     c = none
     a = true
     b += 1
     x: str = z
     q: str = w
     `,
  ],
  [
    "function without parameters",
    `def f() -> str {
        return "true"
     }
     x: str = f()
     `,
  ],
  [
    "function with parameters",
    `def f(x: num, y: bool) -> bool {
        return true
    }
    f(0, true)
    `,
  ],
  [
    "void function",
    `def f(x: bool) -> void {
        return
     }
     f(true)
     `,
  ],
  [
    "non-void function",
    `def f(x: num) -> num {
        return x 
     }`,
  ],
  [
    "class without constructor",
    `class c {
        this.x: num = 1
     }
     d: c = c()
     f: c
     f = c()
     `,
  ],
  [
    "class with constructor",
    `class d {
      this.pure: num = 0
      def __init__(self, x: bool) {
          this.valid: bool = x
        }
      }
      x: d = d(true)
      x = d(false)
      x.pure = 1`,
  ],
  [
    "class with method",
    `class d {
        def __init__(self, x: bool) {
            this.valid: bool = x
        }
        def flipValid(self) -> void {
            this.valid = not this.valid
        }
     }`,
  ],
  [
    "accessing class fields outside class",
    `class d {
        def __init__(self, x: bool) {
            this.valid: bool = x
        }
        def flipValid(self) -> void {
            this.valid = not this.valid
        }
     }
     example: d = d(true)
     variable: bool = d.valid
     d.flipValid()
     `,
  ],
  [
    "breaking for loop",
    `x: num = 0
     y: num = 5
     for i: num = x, i < y + 4 + 4, ++i {
        if i == 2 {
            break
        } else {
          break
        }
     }`,
  ],
  [
    "equal for loop",
    `
     for i: num = 2, i == 2, ++i {
        for j: num = 2, j >= 2, --j {
          for k: num = 2, k <= 2, ++k {
            a: num = 0
          }
        }
     }`,
  ],
  [
    "breaking while loop",
    `j: num = 0
      while j <= 20 {
        if j == 10 {
          break
        } elif j == 0 {
          break
        } else {
          break
        }
        j += 2
      }`,
  ],
];
const semanticErrors = [
  [
    "variable redeclaration",
    `x: int = 0
     x: str = "0"`,
  ],
  ["variable declaration", `x = 2`],
  [
    "readonly redeclaration",
    `readonly x: str = "l"
     x: int = 0`,
  ],
  [
    "readonly reassignment",
    `readonly x: int = 0
     x = 2`,
  ],
  [
    "readonly changing",
    `readonly x: int = 99
     x++`,
  ],
  [
    "bad for loop !=",
    `for l: num = 2, l != 2, ++l {
        a: num = 0
      }`,
  ],
  [
    "class field scope",
    `class x { this.x: int = 0 }
     this.x += 1`,
  ],
  [
    "bad for loop outside bounds",
    `for i: num = 6, i < 5, ++i {
        if i == 2 {
            break
        }
     }`,
  ],
  [
    "bad for loop infinite neg",
    `
    x: num = 1 + 1
    
    for i: num = x - 10 - 2 + 1 * 1 / 1, i < 5, --i {
        if i == 2 {
            break
        }
     }`,
  ],
  [
    "bad for loop infinite pos",
    `
    x: num = 1 + 1
    
    for i: num = 1, i > 0, ++i {
        if i == 2 {
            break
        }
     }`,
  ],
  [
    "function variable scope",
    `def x() -> void {
        x: int = 0
     }
     x += 2`,
  ],
  [
    "incorrect function call",
    `def f() -> str {
        return "true"
    }
    x: str = f("0")`,
  ],
  ["break outside function", `break`],
  ["return outside function", `return`],
  [
    "returning value in void function",
    `def f() -> void {
        return true
     }
     f()`,
  ],
  ["Type Mismatch: assignment", `y: bool = 0 and 0`],
  [
    "Type Mismatch: bool only operator",
    `x: str = "done"
     y: bool = not x`,
  ],
  ["Type Mismatch: during assignment", `x: bool = "2"`],
  [
    "Type Mismatch: argument vs. parameter in class",
    `class c {
        def __init__(self, x: int) {
            this.x: int = x
        }
     }
     x: c = c("2")`,
  ],
  [
    "Type Mismatch: argument vs. parameter in function",
    `def f(x: bool) -> bool {
        return x
     }
     f("baby")`,
  ],
  [
    "Type Mismatch: argument vs. parameter in function",
    `def f(x: bool) -> bool {
        return x
     }
     f(none)`,
  ],
  [
    "Type Mismatch: return from function",
    `def f(x: num) -> bool {
        return x
     }`,
  ],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
  it("produces the expected representation for a trivial program", () => {
    assert.deepEqual(
      analyze(parse("x: num = 1 + 2.2")),
      program([
        variableDeclaration(
          variable(false, "x", numType, [binary("+", 1, 2.2, numType)]),
          [binary("+", 1, 2.2, numType)]
        ),
      ])
    );
  });
});
