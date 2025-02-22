import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
    ["empty program", ""],

    ["simple function",
        `ruck greet(name: str) -> str:
            pass "Hello, " + name`],

    ["function with multiple parameters",
        `ruck calculate(x: int, y: int, operation: str) -> int:
            if operation == "add":
                pass x + y
            pass x - y`],

    ["class definition",
        `pitch Player:
            ruck __init__(self, name: str, score: int = 0):
                self.name: str = name
                self.score: int = score`],

    ["for loop",
        `ruck countPoints():
            for i in range(1, 5):
                print(i)`],

    ["while loop",
        `ruck gameLoop():
            running: bool = True
            while running:
                pass False`],

    ["variable declarations",
        `ruck main():
            name: str = "Julian"
            age: int = 25
            active: bool = True`],

    ["list operations",
        `ruck processTeam():
            players: list[str] = ["Julian", "Carson", "Ray"]
            for player in players:
                print(player)`],

    ["dictionary operations",
        `ruck trackScores():
            scores: dict[str, int] = {"Julian": 10, "Carson": 15}
            player: str = "Julian"
            print(scores.get(player))`],

    ["nested functions",
        `ruck outer():
            ruck inner(x: int) -> int:
                pass x * 2
            pass inner(5)`],

    ["function with named arguments",
        `ruck main():
            result: str = greet(name="Julian")
            print(result)`],

    ["optional types",
        `ruck findPlayer(name: str) -> Player | None:
            if name == "":
                pass None
            pass Player(name)`],

    ["multiple statements in function body",
        `ruck process():
            x: int = 1
            y: int = 2
            pass x + y`],

    ["complex type annotations",
        `ruck complexTypes():
            data: list[dict[str, int]] = [{"score": 10}]
            pass data`]
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
    ["missing colon after function definition",
        `ruck main()
            print("Hello")`,
        /Expected ":"/],

    ["invalid function name",
        `ruck 123main():
            pass`,
        /Expected letter/],

    ["missing type annotation",
        `ruck greet(name):
            pass "Hello"`,
        /Expected ":"/],

    ["invalid function call",
        `ruck main():
            print"Hello"`,
        /Expected "\("/],

    ["invalid type syntax",
        `ruck process(data: List[str]):
            pass data`,
        /Expected "list"/],

    ["missing arrow in return type",
        `ruck calc(x: int) str:
            pass "result"`,
        /Expected "->"/],

    ["invalid class syntax",
        `pitch Player
            name: str`,
        /Expected ":"/],

    ["invalid for loop",
        `ruck main():
            for in range(5):
                print("Error")`,
        /Expected identifier/],

    ["invalid dictionary type syntax",
        `ruck main():
            scores: dict[str: int] = {"a": 1}`,
        /Expected ","/],

    ["invalid return statement",
        `ruck getValue() -> int:
            return 5`,
        /Expected "pass"/],

    ["invalid variable declaration",
        `ruck main():
            str name = "Julian"`,
        /Expected identifier/],

    ["invalid binary operator",
        `ruck main():
            x: int = 1 @@ 2`,
        /Expected binaryOp/],

    ["unclosed string literal",
        `ruck main():
            print("unclosed`,
        /Unclosed string literal/],

    ["invalid type union",
        `ruck main():
            x: int | = 1`,
        /Expected type after |/]
];

describe("The parser", () => {
    // Test valid syntax
    for (const [scenario, source] of syntaxChecks) {
        it(`matches ${scenario}`, () => {
            assert.ok(parse(source).succeeded());
        });
    }

    // Test syntax errors
    for (const [scenario, source, errorPattern] of syntaxErrors) {
        it(`detects ${scenario}`, () => {
            assert.throws(() => parse(source), errorPattern);
        });
    }

    // Additional specific test cases
    it("handles empty functions", () => {
        const source = `ruck empty():
            pass`;
        assert.ok(parse(source).succeeded());
    });

    it("handles multiple function definitions", () => {
        const source = `
ruck first():
    pass 1

ruck second():
    pass 2`;
        assert.ok(parse(source).succeeded());
    });

    it("handles nested control structures", () => {
        const source = `ruck nested():
            if True:
                while True:
                    for x in range(1, 10):
                        pass x`;
        assert.ok(parse(source).succeeded());
    });

    it("handles complex expressions", () => {
        const source = `ruck complex():
            x: int = (1 + 2) * 3 - 4 / 2
            pass x`;
        assert.ok(parse(source).succeeded());
    });
});