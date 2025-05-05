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
    name: "basics",
    source: `
      x: str = "0"
      y: num = (1 + 1)
      y = (1 * 1)
      z: bool = not true
      --y
      for i: num = 0, i < 5, ++i {
        p: num = 1
        break
      }
      while (y < 5) {
        ++y
        if (y == 6) {
          break
        }
        if (y == 4) {
          break
        } elif (y == 3) {
          break
        } else {
          break
        }
      }
    `,
    expected: dedent`
      let x_1 = "0";
      let y_2 = (1 + 1);
      y_2 = (1 * 1);
      let z_3 = !(true);
      --(y_2);
      for (let i_4 = 0; i_4 < 5; ++i_4) {
        let p_5 = 1;
        break;
      }
      while (y_2 < 5) {
        ++(y_2);
        if (y_2 == 6) {
          break;
        }
        if (y_2 == 4) {
          break;
        } else if (y_2 == 3) {
          break;
        } else {
          break;
        }
      }
    `,
  },
  {
    name: "function",
    source: `
      def x() -> void {
        return
      }
      x()
      def f(c: num) -> num {
        return num
      }
      f(1)
    `,
    expected: dedent`
      function x_1() {
        return;
      }
      x_1()
      function f_2(c_3) {
        return num;
      }
      f_2(1)
      `,
  },
  {
    name: "class no argument",
    source: `
      class d {
        def __init__() {
          this.x: num = 1
        }
      }
      f: d = d()`,
    expected: dedent`
      class d_1 {
        constructor() {
          this.x_2 = 1;
        }
      }
      let f_3 = new d_1();`,
  },
  {
    name: "class with argument",
    source: `
      class c {
        this.x: num = 1
        def __init__(self, y: num) {
          this.z: num = 0
        }
      }
      g: num = c(1).z
      `,
    expected: dedent`
      class c_1 {
        this.x_2 = 1;
        constructor(y_3) {
          this.z_4 = 0;
        }
      }
      let g_5 = new c_1(1).z;
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
