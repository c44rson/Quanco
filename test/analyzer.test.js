import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import {
  program,
  variableDeclaration,
  variable,
  binary,
  floatType,
} from "../src/core.js";

const semanticChecks = [
  [
    "variable declarations",
    `readonly x: int
     y: str`,
  ],
  [
    "variable assignments",
    `readonly y: int = 0
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
  ["function with parameters"],
  [
    "void function",
    `def f(x: bool) -> void {
        return
     }`,
  ],
  [
    "non-void function",
    `def f(x: int) -> int {
        return x
     }`,
  ],
  [
    "class without constructor",
    `class c {
        this.x: int = 1
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
    `for i: int = 0, i < 5, i++ {
        if i == 2 {
            break
        }
     }`,
  ],
  [
    "breaking while loop",
    `j: int = 0
     while j <= 20 {
        if j == 10 {
            break
        }
        j += 2
     }`,
  ],
  ["union type", ``],
];
const semanticErrors = [
  [
    "variable redeclaration",
    `x: int = 0
     x: str = "0"`,
    /Cannot redeclare variables/,
  ],
  ["variable declaration", `x = 2`, /Variables must be declared/],
  [
    "readonly redeclaration",
    `readonly x: str = "l"
     x: int = 0`,
    /readonly vars cannot be redeclared/,
  ],
  [
    "readonly reassignment",
    `readonly x: int = 0
     x = 2`,
    /readonly vars cannot be reassigned/,
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
    /Cannot access class fields outside of class/,
  ],
  [
    "function variable scope",
    `def x() -> void {
        x: int = 0
     }
     x += 2`,
    /Variable must be redeclared outside scope/,
  ],
  ["break outside function", `break`, /break cannot be used outside loop/],
  [
    "return outside function",
    `return`,
    /return cannot be used outside function/,
  ],
  [
    "returning value in void function",
    `def f() -> void {
        return true
     }`,
    /function with returnType void cannot return a value/,
  ],
  [
    "Type Mismatch: int only operator",
    `x: float = 1.0
     x++`,
    /that operator cannot be used on type float/,
  ],
  [
    "Type Mismatch: bool only operator",
    `x: str = "done"
     y: bool = not x`,
    /not cannot be used on type str/,
  ],
  [
    "Type Mismatch: during assignment",
    `x: int = "2"`,
    /variable types must match during assignment/,
  ],
  [
    "Type Mismatch: argument vs. parameter in class",
    `class c {
        def __init__(self, x: int) {
            this.x: int = x
        }
     }
     x: c = c("2")`,
    /class arguments must match definition/,
  ],
  [
    "Type Mismatch: argument vs. parameter in function",
    `def f(x: bool) -> bool {
        return bool
     }
     f("baby")`,
    /function arguments must match definition/,
  ],
  [
    "Type Mismatch: return from function",
    `def f() -> bool {
        return 0
     }`,
    /return must match type in declaration/,
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
      analyze(parse("x: float = 1 + 2.2")),
      program([
        variableDeclaration(
          variable("x", true, floatType),
          binary("+", 1, 2.2, floatType)
        ),
      ])
    );
  });
});
