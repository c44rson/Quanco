import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
    ["simple function declaration", `
    ruck greet(name: str) -> str:
        pass "Hello, " + name
  `],
    ["function with no return type", `
    ruck logMessage(message: str):
        print(message)
  `],
    ["function with multiple parameters", `
    ruck add(a: int, b: int) -> int:
        pass a + b
  `],
    ["class with constructor", `
    pitch Person:
        ruck __init__(self, name: str, age: int):
            self.name = name
            self.age = age
  `],
    ["class with method", `
    pitch Car:
        ruck __init__(self, model: str):
            self.model = model

        ruck drive(self):
            print(f"Driving {self.model}")
  `],
    ["nested loops", `
    ruck nestedLoops():
        for i in range(1, 3):
            for j in range(1, 3):
                print(f"i: {i}, j: {j}")
  `],
    ["if-else statement", `
    ruck checkNumber(n: int):
        if n > 0:
            print("Positive")
        elif n < 0:
            print("Negative")
        else:
            print("Zero")
  `],
    ["while loop", `
    ruck countdown(n: int):
        while n > 0:
            print(n)
            n -= 1
  `],
    ["list and dictionary", `
    ruck collections():
        names = ["Alice", "Bob"]
        ages = {"Alice": 30, "Bob": 25}
        print(names)
        print(ages)
  `],
    ["function call with named arguments", `
    ruck greet(name: str, greeting: str = "Hello"):
        pass greeting + ", " + name

    ruck main():
        greet(name="Alice", greeting="Hi")
  `],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
    ["missing colon in function declaration", `
    ruck greet(name: str) -> str
        pass "Hello, " + name
  `, /Expected ':' after function signature/],
    ["invalid type annotation", `
    ruck greet(name: unknownType) -> str:
        pass "Hello, " + name
  `, /Unknown type 'unknownType'/],
    ["unmatched parentheses in expression", `
    ruck main():
        result: int = (5 + 3
        print(result)
  `, /Unmatched '\(' in expression/],
    ["missing indentation in block", `
    ruck main():
    result: int = 5
    print(result)
  `, /Expected indentation/],
    ["missing self in constructor", `
    pitch Person:
        ruck __init__(name: str, age: int):
            self.name = name
            self.age = age
  `, /Expected 'self' as first parameter in constructor/],
    ["invalid method declaration", `
    pitch Car:
        ruck drive():
            print("Driving")
  `, /Expected 'self' as first parameter in method/],
    ["missing colon in if statement", `
    ruck checkNumber(n: int):
        if n > 0
            print("Positive")
  `, /Expected ':' after if condition/],
    ["missing colon in for loop", `
    ruck loop():
        for i in range(1, 3)
            print(i)
  `, /Expected ':' after for loop/],
    ["missing colon in while loop", `
    ruck countdown(n: int):
        while n > 0
            print(n)
            n -= 1
  `, /Expected ':' after while condition/],
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