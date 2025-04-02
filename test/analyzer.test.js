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
    "variable assignments",
    `readonly y: num = 0
     z: str = "0"
     a: bool = true
     b: float = 0.0
     c: none = none`,
  ],
  [
    "function without parameters",
    `def f() -> void {
        return
     }`,
  ],
  [
    "function with parameters",
    `def f(x: num, y: bool) -> bool {
        return true
    }`,
  ],
  [
    "void function",
    `def f(x: bool) -> void {
        return
     }`,
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
        def __init__(self, x: bool) {
            this.valid: bool = x
        }
     }`,
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
  [
    "Type Mismatch: int only operator",
    `x: float = 1.0
     x++`,
  ],
  [
    "Type Mismatch: bool only operator",
    `x: str = "done"
     y: bool = not x`,
  ],
  ["Type Mismatch: during assignment", `x: int = "2"`],
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
    "Type Mismatch: return from function",
    `def f() -> bool {
        return 0
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
        variableDeclaration(variable(false, null, "x", numType), [
          binary("+", 1, 2.2, numType),
        ]),
      ])
    );
  });
});
