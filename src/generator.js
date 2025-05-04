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
      // category
    },

    Category(c) {
      // name, methods, attributes, params, body
    },

    ConstructorCall(c) {
      // callee, args
    },

    FunctionDeclaration(d) {
      // fun
    },

    Function(f) {
      // name, params, body, type
    },

    FunctionCall(c) {
      // callee, args
    },

    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)}`);
    },

    ShortReturnStatement(s) {
      output.push("return");
    },

    IfStatement(s) {
      // test, consequent, alternates, final
      output.push(
        `if (${gen(s.test.left)} ${gen(s.test.op)} ${gen(s.test.right)}) {`
      );
      s.consequent.forEach(gen);
      if (s.alternates.length) {
        s.alternates.forEach((alternate) => {
          output.push(`} ${gen(alternate)}`);
          console.log(gen(alternate));
        });
      }
    },

    ElifStatement(s) {
      // condition, body
      output.push(
        `} else if (${gen(s.condition.left)} ${gen(s.condition.op)} ${gen(
          s.condition.right
        )}) {`
      );
      s.body.forEach(gen);
      output.push(`}`);
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

    BreakStatement(s) {
      output.push("break");
    },

    VariableDeclaration(d) {
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer[0])};`);
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
      return `(${gen(e.left)} ${op} ${gen(e.right)});`;
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

    PropertyExpression(e) {
      // base, prop
    },

    PostfixExpression(e) {
      // ops, base, type
    },
  };

  gen(program);
  return output.join("\n");
}
