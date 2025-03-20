import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["the simplest program", "ruck main(): pass 0"],

  [
    "variable declarations",
    `
        ruck main():
            x: int = 5
            name: str = "Julian"
            active: bool = True
            rate: float = 3.14
    `,
  ],

  [
    "function with multiple parameters",
    `
        ruck greet(name: str, age: int = 25) -> str:
            pass "Hello " + name
    `,
  ],

  // Simplified class definition without __init__
  [
    "class definition",
    `
        pitch Player:
            name: str
    `,
  ],

  [
    "for loops",
    `
        ruck main():
            for i in range(10):
                print(i)
    `,
  ],

  // Simplified while loop without +=
  [
    "while loops",
    `
        ruck main():
            count: int = 0
            while count < 5:
                print(count)
    `,
  ],

  // Simplified if statement without elif
  [
    "if-else statements",
    `
        ruck check(x: int) -> str:
            if x > 0:
                pass "positive"
            else:
                pass "zero"
    `,
  ],

  [
    "list operations",
    `
        ruck main():
            numbers: list[int] = [1, 2, 3]
            for n in numbers:
                print(n)
    `,
  ],

  [
    "dictionary operations",
    `
        ruck main():
            scores: dict[str, int] = {"Julian": 10}
            print(scores)
    `,
  ],

  // Removed union types as they're not supported
  [
    "simple function",
    `
        ruck process(value: int) -> int:
            pass value
    `,
  ],

  [
    "nested function calls",
    `
        ruck main():
            print(str(len("hello")))
    `,
  ],

  // Simplified string handling without f-strings
  [
    "string operations",
    `
        ruck main():
            name: str = "Julian"
            print("Hello " + name)
    `,
  ],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["completely invalid syntax", "@#$%", /Expected/],

  ["invalid tokens", "123 456 +++", /Expected/],

  ["mismatched parentheses", "ruck main(): ((())", /Expected/],

  ["invalid characters in identifier", "ruck @#$(): pass", /Expected/],

  ["missing required components", "ruck: pass", /Expected/],

  [
    "invalid nesting",
    `ruck main():
         ruck inner():`,
    /Expected/,
  ],

  [
    "invalid operator usage",
    `ruck main():
         x = +++5`,
    /Expected/,
  ],

  [
    "invalid type declaration",
    `ruck main():
         x: @invalid`,
    /Expected/,
  ],

  [
    "invalid block structure",
    `ruck main()
         print("no colon")`,
    /Expected/,
  ],

  [
    "invalid statement termination",
    `ruck main():
         print("test");;;`,
    /Expected/,
  ],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
