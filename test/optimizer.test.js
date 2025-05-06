import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});
