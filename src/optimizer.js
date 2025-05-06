import * as core from "./core.js";

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node;
}

const isZero = (n) => n === 0 || n === 0n;
const isOne = (n) => n === 1 || n === 1n;

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize);
  },
  ClassDeclaration(c) {
    c.category = optimize(c.category);
    return c;
  },
  FunctionDeclaration(d) {
    d.fun = optimize(d.fun);
    return d;
  },
  Function(f) {
    f.body = f.body.flatMap(optimize);
    return f;
  },
  ReturnStatement(s) {
    s.expression = optimize(s.expression);
    return s;
  },
  ShortReturnStatement(s) {
    return s;
  },
  IfStatement(s) {
    s.test = optimize(s.test);
    s.consequent.flatMap(optimize);
    s.alternates?.forEach(optimize);
    s.final = s.final ? optimize(s.final) : s.final;
    if (!s.test.kind) {
      return s.test ? s.consequent : s.alternates;
    }
    return s;
  },
  ElifStatement(s) {
    s.condition = optimize(s.condition);
    s.body.flatMap(optimize);
    return s;
  },
  ForStatement(s) {
    s.iterator = optimize(s.iterator);
    s.condition = optimize(s.condition);
    s.step = optimize(s.step);
    s.body = s.body.flatMap(optimize);
    return s;
  },
  WhileStatement(s) {
    s.test = optimize(s.test);
    if (s.test === false) {
      return [];
    }
    s.body = s.body.flatMap(optimize);
    return s;
  },
  VariableDeclaration(s) {
    s.variable = optimize(s.variable);
    if (s.initializer.length) {
      if (s.initializer[0].type !== "str") {
        s.initializer = optimize(s.initializer[0]);
      }
    } else {
      s.initializer = optimize(s.initializer);
    }
    return s;
  },
  Variable(v) {
    if (v.value.length) {
      if (v.value[0].type !== "str") {
        v.value = optimize(v.value[0]);
      }
    }
    return v;
  },
  Assignment(s) {
    s.target = optimize(s.target);
    s.source = optimize(s.source);
    if (s.source === s.target) {
      return [];
    }
    return s;
  },
  BreakStatement(s) {},
  BinaryExpression(e) {
    e.op = optimize(e.op);
    e.left = optimize(e.left);
    e.right = optimize(e.right);
    if (e.op === "and") {
      if (e.left === true) return e.right;
      if (e.right === true) return e.left;
    } else if (e.op === "or") {
      if (e.left === false) return e.right;
      if (e.right === false) return e.left;
    } else if (!e.left.kind) {
      if (!e.right.kind) {
        if (e.op === "+") return e.left + e.right;
        if (e.op === "-") return e.left - e.right;
        if (e.op === "*") return e.left * e.right;
        if (e.op === "/") return e.left / e.right;
        if (e.op === "<") return e.left < e.right;
        if (e.op === "<=") return e.left <= e.right;
        if (e.op === "==") return e.left === e.right;
        if (e.op === "!=") return e.left !== e.right;
        if (e.op === ">=") return e.left >= e.right;
        if (e.op === ">") return e.left > e.right;
      }
      if (isZero(e.left) && e.op === "+") return e.right;
      if (isOne(e.left) && e.op === "*") return e.right;
      if (isZero(e.left) && ["*", "/"].includes(e.op)) return e.left;
    } else if (!e.right.kind) {
      if (["+", "-"].includes(e.op) && isZero(e.right)) return e.left;
      if (["*", "/"].includes(e.op) && isOne(e.right)) return e.left;
      if (e.op === "*" && isZero(e.right)) return e.right;
    }
    return e;
  },
  UnaryExpression(e) {
    e.op = optimize(e.op);
    e.operand = optimize(e.operand);
    return e;
  },
  ConstructorCall(c) {
    c.callee = optimize(c.callee);
    c.args = c.args.map(optimize);
  },
  FunctionCall(c) {
    c.callee = optimize(c.callee);
    c.args = c.args.map(optimize);
    return c;
  },
  PropertyExpression(e) {
    e.base = optimize(e.base);
    e.prop = optimize(e.prop);
    return e;
  },
  PostfixExpression(e) {
    e.ops = optimize(e.ops);
    e.base = optimize(e.base);
    return e;
  },
  Print(s) {
    s.args = s.args.map(optimize);
    return s;
  },
};
