import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["the simplest program", " "],

  [
    "variable declarations",
    `
        def example() -> void {
            x: int = 5
            name: str = "Julian"
            active: bool = true
            rate: float = 3.14
        }
    `,
  ],

  [
    "function with multiple parameters",
    `
        def greet(name: str, age: int = 25) -> str {
            return "Hello " + name
        }
    `,
  ],

  [
    "class definition",
    `
        class Player {
            name: str
        }
    `,
  ],

  [
    "for loops",
    `
        def example() -> void {
            for i in range(10) {
                print(i)
            }
        }
    `,
  ],

  [
    "while loops",
    `
        def example() -> void {
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
        def check(x: int) -> str {
            if x > 0 {
                return "positive"
            }
            else {
                return "zero"
            }
        }
    `,
  ],

  [
    "list operations",
    `
        def example() -> void {
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
        def example() -> void {
            scores: dict[str, int] = {"Julian": 10}
            print(scores)
        }
    `,
  ],

  [
    "simple function",
    `
        def process(value: int) -> int {
            return value
        }
    `,
  ],

  [
    "nested function calls",
    `
        def example() -> void {
            print(str(len("hello")))
        }
    `,
  ],

  [
    "string operations",
    `
        def example() -> void {
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

  ["mismatched parentheses", "def main() { ((()) }", /Expected/],

  ["invalid characters in identifier", "def @#$() { return }", /Expected/],

  ["missing required components", "def { return }", /Expected/],

  [
    "invalid nesting",
    `def main() {
      def inner() {
      }
    }`,
    /Expected/,
  ],

  [
    "invalid operator usage",
    `def main(){
      x = +++5
    }`,
    /Expected/,
  ],

  [
    "invalid type declaration",
    `def main() {
      x: @invalid
    }`,
    /Expected/,
  ],

  [
    "invalid block structure",
    `def main()
         print("no colon")`,
    /Expected/,
  ],

  [
    "invalid statement termination",
    `def main() {
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
