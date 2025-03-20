import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["the simplest program", " "],

  [
    "variable declarations",
    `
        ruck example() -> void {
          x: int = 5
          name: str = "Julian"
          active: bool = True
          rate: float = 3.14
        }
    `,
  ],

  [
    "function with multiple parameters",
    `
        ruck greet(name: str, age: int = 25) -> str {
          pass "Hello " + name
        }
    `,
  ],

  [
    "class definition",
    `
        pitch Player {
          name: str
        }
    `,
  ],

  [
    "for loops",
    `
        ruck example() -> void {
          for i in range(10) {
            print(i)
          }
        }
    `,
  ],

  [
    "while loops",
    `
        ruck example() -> void {
          count: int = 0
          while count < 5 {
              print(count)
          }
        }
    `,
  ],

  [
    "if-else statements",
    `
        ruck check(x: int) -> str {
          if x > 0 {
            pass "positive"
          }
          else {
            pass "zero"
          }
        }
    `,
  ],

  [
    "list operations",
    `
        ruck example() -> void {
          numbers: list[int] = [1, 2, 3]
          for n in numbers {
            print(n)
          }
        }
    `,
  ],

  [
    "dictionary operations",
    `
        ruck example() -> void {
          scores: dict[str, int] = {"Julian": 10}
          print(scores)
        }
    `,
  ],

  [
    "simple function",
    `
        ruck process(value: int) -> int {
          pass value
        }
    `,
  ],

  [
    "nested function calls",
    `
        ruck example() -> void {
          print(str(len("hello")))
        }
    `,
  ],

  [
    "string operations",
    `
        ruck example() -> void {
          name: str = "Julian"
          print("Hello " + name)
        }
    `,
  ],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["completely invalid syntax", "@#$%", /Expected/],

  ["invalid tokens", "123 456 +++", /Expected/],

  ["mismatched parentheses", "ruck main() { ((()) }", /Expected/],

  ["invalid characters in identifier", "ruck @#$() { pass }", /Expected/],

  ["missing required components", "ruck { pass }", /Expected/],

  [
    "invalid nesting",
    `ruck main() {
      ruck inner() {
      }
    }`,
    /Expected/,
  ],

  [
    "invalid operator usage",
    `ruck main(){
      x = +++5
    }`,
    /Expected/,
  ],

  [
    "invalid type declaration",
    `ruck main() {
      x: @invalid
    }`,
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
    `ruck main() {
      print("test");;;
    }`,
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
