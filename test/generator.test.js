import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "small",
    source: `
      x: str = "0"
      y: num = 1
      z: bool = not true
      ++y
      for i: num = 0, i < 5, ++i {
        p: num = 1
        break
      }
      while (y < 5) {
        ++y
        if (y == 4) {
          break
        } elif (y == 3) {
          break
        }
      }
    `,
    expected: dedent`
      let x_1 = "0";
      let y_2 = 1;
      let z_3 = !(true);
      ++(y_2);
      for (let i_4 = 0; i_4 < 5; ++i_4) {
        let p_5 = 1;
        break;
      }
      while (y_2 < 5) {
        ++(y_2);
        if (y_2 == 4) {
          break;
        } else if (y_2 == 3) {
          break;
        }
      }
    `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
