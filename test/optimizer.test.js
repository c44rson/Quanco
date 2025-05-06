import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

const x = core.variable(false, "x", core.numType, 1);
const y = core.variable(false, "y", core.numType, -10);
const xpp = core.postfixExpression("++", x, core.numType);

const tests = [
  ["folds +", core.binary("+", 5, 8), 13],
  ["if", core.ifStatement(true, [xpp]), [xpp]],
  ["if false", core.ifStatement(false, [xpp], [xpp]), [xpp]],
  [
    "property",
    core.propertyExpression(1 + 1, x),
    core.propertyExpression(2, x),
  ],
  [
    "function",
    core.functionCall(x, [1 * 1, 2 - 2, 1 / 1]),
    core.functionCall(x, [1, 0, 1]),
  ],
  [
    "constructor",
    core.constructorCall(x, [1 == 1]),
    core.constructorCall(x, [true]),
  ],
  ["binary eq", core.binary("==", 12, 1, core.booleanType), false],
  ["binary *", core.binary("*", 12, 1, core.numType), 12],
  ["binary /", core.binary("/", 12, 1, core.numType), 12],
  ["binary <", core.binary("<", 12, 1, core.booleanType), false],
  ["binary <=", core.binary("<=", 12, 1, core.booleanType), false],
  ["binary -", core.binary("-", 2, 2, core.numType), 0],
  ["binary >", core.binary(">", 1, 2, core.booleanType), false],
  ["binary or true", core.binary("or", true, false), true],
  ["binary or false", core.binary("or", false, false), false],
  ["binary and false", core.binary("and", false, true), false],
  ["binary and true", core.binary("and", true, true), true],
  ["binary !=", core.binary("!=", 1, 1), false],
  ["binary >=", core.binary(">=", 1, 1), true],
  ["binary left */ 1", core.binary("*", y, 1), y],
  ["binary left * 0", core.binary("*", y, 0), 0],
  ["binary left +- 0", core.binary("+", y, 0), y],
  ["binary right + 0", core.binary("+", 0, x), x],
  ["binary right * 0", core.binary("*", 0, x), 0],
  ["binary right * 0", core.binary("*", 1, x), x],
  ["while", core.whileStatement(false, core.print(true)), []],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});
