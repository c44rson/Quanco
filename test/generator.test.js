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
      print("0")
      x: str = "0"
      y: num = (1 + 1)
      y = (2 * y) - y
      z: bool = not true
      --y
    `,
    expected: dedent`
      console.log("0");
      let x_1 = "0";
      let y_2 = 2;
      y_2 = ((2 * y_2) - y_2);
      let z_3 = !(true);
      --(y_2);
    `,
  },
  {
    name: "for",
    source: `
      x: num = 0
      for i: num = 0, i < 5, ++i {
        p: num = 1
        break
      }
      for j: num = x, j < 5, ++j {
        x = x
      }`,
    expected: dedent`
      let x_1 = 0;
      for (let i_2 = 0; i_2 < 5; ++i_2) {
        let p_3 = 1;
        break;
      }
      for (let j_4 = x_1; j_4 < 5; ++j_4) {
      }
      `,
  },
  {
    name: "while",
    source: `
      y: num = 0
      while (y < 5) {
        ++y
        if (y == 6) {
          break
        }
      }`,
    expected: dedent`
      let y_1 = 0;
      while (y_1 < 5) {
        ++(y_1);
        if (y_1 == 6) {
          break;
        }
      }`,
  },
  {
    name: "if",
    source: `
      y: num = 0
      if (y == 4) {
        y = 1
      } elif (y == 3) {
        y = 2
      } else {
        y = 3
      }`,
    expected: dedent`
      let y_1 = 0;
      if (y_1 == 4) {
        y_1 = 1;
      } else if (y_1 == 3) {
        y_1 = 2;
      } else {
        y_1 = 3;
      }`,
  },
  {
    name: "functions",
    source: `
      def x() -> void {
        return
      }
      x()
      def f(x: num) -> void {
        return
      }
      f(2)
      def y(x: num) -> num {
        return x
      }
      y(1)
    `,
    // note that non-void function calls do not generate as there is no use
    expected: dedent`
      function x_1() {
        return;
      }
      x_1()
      function f_2(x_3) {
        return;
      }
      f_2(2)
      function y_4(x_5) {
        return x_5;
      }
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
  {
    name: "class methods",
    source: `
      class d {
        def __init__(self, x: bool) {
            this.valid: bool = x
        }
        def flipValid(self) -> void {
            this.valid = not this.valid
        }
      }
      example: d = d(true)
      variable: bool = d.valid
      d.flipValid()`,
    expected: dedent`
      class d_1 {
        constructor(x_2) {
        this.valid_3 = x_2;
      }
        function flipValid_4(self) {
          this.valid_3 = !(this.valid_3);
        }
      }
      let example_5 = new d_1(true);
      let variable_6 = d.valid;
      d.flipValid();
      `,
  },
  {
    name: "long",
    source: `
      class c {
        this.a: num = 0
        this.b: num = this.a
        def __init__(self, d: num) {
          if (d > 1) {
            print(d)
          } elif (d < 1) {
            print(d)
          } else {
            this.b = 2
          }
        
        }
      }
      e: num = c(1).b
      f: c = c(1)
      g: num = e
      x: c
      def y(x: num, z: bool) -> void {
        for i: num = x, i < 10, ++i {
            print(i)
        }
      }
      y(1, false)
    `,
    expected: dedent`
      class c_1 {
        this.a_2 = 0;
        this.b_3 = this.a_2;
        constructor(d_4) {
          if (d_4 > 1) {
            console.log(d_4);
          } else if (d_4 < 1) {
            console.log(d_4);
          } else {
            this.b_3 = 2;
          }
        }
      }
      let e_5 = new c_1(1).b;
      let f_6 = new c_1(1);
      let g_7 = e_5;
      let x_8;
      function y_9(x_10, z_11) {
        for (let i_12 = x_10; i_12 < 10; ++i_12) {
          console.log(i_12);
        }
      }
      y_9(1, false)
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
