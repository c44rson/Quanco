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
     `,
  ],
  [
    "variable assignments",
    `readonly y: num = 0
     z: str | none = "0"
     a: bool = false or true and true
     b: num = (0.0 - 1 * 5)
     c: none = none
     c = none
     a = true
     b += 1
     x: str = z
     `,
  ],
  [
    "function without parameters",
    `def f() -> str {
        return "true"
     }`,
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
     }`,
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
     variable: bool = d.valid`,
  ],
  [
    "breaking for loop",
    `for i: num = 0, i < 5, ++i {
        if i == 2 {
            break
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
    "bad for loop infinite",
    `
    x: num = 1 + 1
    
    for i: num = x - 10 - 2 + 1 * 1 / 1, i < 5, --i {
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
  ["break outside function", `break`],
  ["return outside function", `return`],
  [
    "returning value in void function",
    `def f() -> void {
        return true
     }`,
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
        return bool
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
