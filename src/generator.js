import * as core from "./core.js";

export default function generate(program) {
  const output = [];

  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name}_${mapping.get(entity)}`;
    };
  })(new Map());

  const gen = (node) => generators?.[node?.kind]?.(node) ?? node;

  const generators = {
    Program(p) {
      p.statements.forEach(gen);
    },

    ClassDeclaration(c) {
      c.category.params = c.category.params ? c.category.params : [];
      output.push(`class ${gen(c.category)} {`);
      c.category.body.forEach((cat) => {
        if (cat.name == "__init__") {
          c.category.params = c.category.params.filter(
            (param) => param !== "self"
          );
          output.push(
            `constructor(${c.category.params.map(gen).join(", ")}) {`
          );
          c.category.constructor.body.forEach(gen);
          output.push(`}`);
        } else {
          gen(cat);
        }
      });
      output.push(`}`);
    },

    Category(c) {
      return targetName(c);
    },

    FunctionDeclaration(d) {
      d.fun.params = d.fun.params ? d.fun.params : [];
      output.push(
        `function ${gen(d.fun)}(${d.fun.params?.map(gen).join(", ")}) {`
      );
      d.fun.body.forEach(gen);
      output.push("}");
    },

    Function(f) {
      return targetName(f);
    },

    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`);
    },

    ShortReturnStatement(s) {
      output.push("return;");
    },

    IfStatement(s) {
      output.push(
        `if (${gen(s.test.left)} ${gen(s.test.op)} ${gen(s.test.right)}) {`
      );
      s.consequent.forEach(gen);
      s.alternates.forEach(gen);
      if (s.final) {
        output.push(`} else {`);
        s.final.forEach(gen);
        output.push(`}`);
      } else {
        output.push(`}`);
      }
    },

    ElifStatement(s) {
      output.push(
        `} else if (${gen(s.condition.left)} ${gen(s.condition.op)} ${gen(
          s.condition.right
        )}) {`
      );
      s.body.forEach(gen);
    },

    ForStatement(s) {
      output.push(
        `for (let ${gen(s.iterator.variable)} = ${gen(
          s.iterator.initializer[0]
        )}; ${gen(s.condition.left)} ${gen(s.condition.op)} ${gen(
          s.condition.right
        )}; ${s.step.op}${gen(s.step.operand)}) {`
      );
      s.body.forEach(gen);
      output.push("}");
    },

    WhileStatement(s) {
      output.push(
        `while (${gen(s.test.left)} ${gen(s.test.op)} ${gen(s.test.right)}) {`
      );
      s.body.forEach(gen);
      output.push("}");
    },

    VariableDeclaration(d) {
      if (d.variable.name.includes("this.")) {
        output.push(`${gen(d.variable)} = ${gen(d.initializer[0])};`);
      } else {
        output.push(`let ${gen(d.variable)} = ${gen(d.initializer[0])};`);
      }
    },

    Variable(v) {
      return targetName(v);
    },

    Assignment(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`);
    },

    BreakStatement(s) {
      output.push("break;");
    },

    BinaryExpression(e) {
      const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op;
      return `(${gen(e.left)} ${op} ${gen(e.right)})`;
    },

    UnaryExpression(e) {
      const operand = gen(e.operand);
      if (e.op === "not") {
        e.op = "!";
        return `${e.op}(${operand})`;
      } else if (e.op === "++" || e.op === "--") {
        output.push(`${e.op}(${operand});`);
      }
    },

    ConstructorCall(c) {
      return `new ${gen(c.callee)}(${c.args.map(gen).join(", ")})`;
    },

    FunctionCall(c) {
      if (c.args.length) {
        output.push(`${gen(c.callee)}(${c.args.map(gen).join(", ")})`);
      } else {
        return output.push(`${gen(c.callee)}()`);
      }
    },

    PropertyExpression(e) {
      if (e.prop.kind === "Variable") {
        return `.${e.prop.name.split(".")[1]}`;
      }
      return `.${e.prop.value}`;
    },

    PostfixExpression(e) {
      let start = "";
      e.ops.forEach((op) => {
        start = start + gen(op);
      });
      return start;
    },
  };

  gen(program);
  return output.join("\n");
}
