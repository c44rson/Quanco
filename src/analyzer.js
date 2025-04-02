import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    globalClassNamespace = new Map(),
    locals = new Map(),
    inLoop = false,
    class: c = null,
    function: f = null,
  }) {
    Object.assign(this, {
      parent,
      globalClassNamespace,
      locals,
      inLoop,
      class: c,
      function: f,
    });
  }
  add(name, entity) {
    this.locals.set(name, entity);
  }
  assignClassNamespace(id, entity) {
    this.globalClassNamespace.set(id, entity);
  }
  lookup(name) {
    return (
      this.locals.get(name) ||
      this.globalClassNamespace.get(name) ||
      this.parent?.lookup(name)
    );
  }
  static root() {
    return new Context({
      locals: new Map(Object.entries(core.standardLibrary)),
    });
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() });
  }
}

export default function analyze(match) {
  /* a local variable to hold the current context */
  let context = Context.root();

  /* a bunch of semantic validation functions */
  function must(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage();
      throw new Error(`${prefix}${message}`);
    }
  }

  // HELPER FUNCTIONS

  // MUST RULES
  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at);
  }

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function mustHaveNumericType(e, at) {
    const expectedTypes = [core.numType];
    must(expectedTypes.includes(e.type), "Expected a number", at);
  }

  function mustHaveNumericOrStringType(e, at) {
    const expectedTypes = [core.numType, core.stringType];
    must(expectedTypes.includes(e.type), "Expected a number or string", at);
  }

  function mustHaveBooleanType(e, at) {
    must(e.type === core.booleanType, "Expected a boolean", at);
  }

  function mustHaveIntegerType(e, at) {
    must(e.type === core.numType, "Expected an integer", at);
  }

  function mustBothHaveTheSameType(e1, e2, at) {
    must(
      equivalent(e1.type, e2.type),
      "Operands do not have the same type",
      at
    );
  }

  function equivalent(t1, t2) {
    return (
      t1 === t2 ||
      (t1 === "str" && t2 === "num") ||
      (t1 === "num" && t2 === "str") ||
      (t1?.kind === "UnionType" &&
        t2?.kind === "UnionType" &&
        equivalent(t1.baseType, t2.baseType)) ||
      (t1?.kind === "FunctionType" &&
        t2?.kind === "FunctionType" &&
        equivalent(t1.returnType, t2.returnType) &&
        t1.paramTypes.length === t2.paramTypes.length &&
        t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
    );
  }

  // BOB THE BUILDER
  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.rep()));
    },

    Block(_open, statements, _close) {
      // No need for a block node, just return the list of statements
      return statements.children.map((s) => s.rep());
    },

    /* Definitions of the semantic actions */
    ClassDecl(_class, id, block) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      const type = core.classType(id.sourceString, null, []);
      context.add(id.sourceString, type);

      // Create new child context (recursion)
      context = context.newChildContext({ inLoop: false, class: type });

      type.body = block.rep();

      context = context.parent;

      return core.classDeclaration(type);
    },

    FunctionDecl(_def, id, _left, parameters, _right, _arrow, type, block) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      const fun = core.fun(context.class, id.sourceString);

      if (context.class) {
        context.assignClassNamespace(id, fun);
      }
      context.add(id.sourceString, fun);

      context = context.newChildContext({ inLoop: false, function: fun });
      fun.params = parameters.rep();

      const paramTypes = fun.params.map((param) => param.type);
      const returnType = type.children?.[0]?.rep() ?? core.voidType;

      fun.body = block.rep();

      fun.type = core.functionType(paramTypes, returnType);

      // Go back up to the outer context before returning
      context = context.parent;
      return core.functionDeclaration(fun);
    },

    ConstructorDecl(_def, __init__, _left, parameters, _right, block) {
      const constructor = core.constructor(context.class, "init");
      context.assignClassNamespace("init", constructor);

      context = context.newChildContext({
        inLoop: false,
        function: constructor,
      });
      constructor.params = parameters.rep();

      const paramTypes = constructor.params.map((param) => param.type);

      constructor.body = block.rep();

      constructor.type = core.constructorType(paramTypes);

      context = context.parent;
      context.class.constructor = constructor;
      return core.constructorDeclaration(constructor);
    },

    ReturnType(type) {
      if (type.sourceString === "void") {
        return core.voidType;
      } else {
        return type.rep();
      }
    },

    ReturnStmt_longReturn(_return, exp) {
      return core.returnStatement(exp.rep());
    },

    ReturnStmt_shortReturn(_return) {
      return core.shortReturnStatement;
    },

    VarDecl(modifier, id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });

      const readonly = modifier.sourceString === "readonly";
      const classAffil = context.class;
      const name = id.sourceString;
      const initializer = exp.rep();
      const variable = core.variable(
        readonly,
        classAffil,
        name,
        type.sourceString
      );

      context.add(id.sourceString, variable);

      if (classAffil) {
        context.assignClassNamespace(name, variable);
      }

      return core.variableDeclaration(variable, initializer);
    },

    Assignment(lval, _eq, expr) {
      return core.assignment(lval.rep(), expr.rep());
    },

    // STATEMENTS
    ForLoop(_for, varDecl, _comma1, condition, _comma2, unaryExpr, body) {
      const iterator = varDecl.rep();
      const conditionExpr = condition.rep();
      const step = unaryExpr.rep();
      context = context.newChildContext({ inLoop: true });
      const bodyBlock = body.rep();
      context = context.parent;

      return core.forStatement(iterator, conditionExpr, step, bodyBlock);
    },

    WhileLoop(_while, exp, block) {
      const test = exp.rep();

      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext({ inLoop: true });
      const body = block.rep();
      context = context.parent;
      return core.whileStatement(test, body);
    },

    IfStmt(
      _if,
      condition,
      consequent,
      _elif,
      elif_conditions,
      elif_blocks,
      _else,
      final
    ) {
      const test = condition.rep();
      const consequentBlock = consequent.rep();

      const alternates = elif_conditions.children.map((e, idx) => {
        const elifCondition = e.rep();
        const elifBlock = elif_blocks.children[idx].rep();
        return { condition: elifCondition, block: elifBlock };
      });

      const finalBlock = final ? final.rep() : null;

      return core.ifStatement(test, consequentBlock, alternates, finalBlock);
    },

    Params(_self, _comma, paramList) {
      return paramList.children.map((p) => p.rep());
    },

    Param(node) {
      const [id, _colon, type, _eq, exp] = node.children;

      mustNotAlreadyBeDeclared(id.sourceString, { at: node });

      const param = core.variable(
        false,
        context.class,
        id.sourceString,
        type.rep()
      );
      const initializer = exp.rep();

      context.add(param.name, param);

      return core.variableDeclaration(param, initializer);
    },

    BreakStmt(breakKeyword) {
      mustBeInLoop({ at: breakKeyword });
      return core.breakStatement;
    },

    // EXPR
    Exp_OrExpr(exp, _ops, exps) {
      let left = exp.rep();
      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: exps });
        left = core.binary("or", left, right, core.booleanType);
      }
      return left;
    },

    Exp1_AndExpr(exp, _ops, exps) {
      let left = exp.rep();
      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: exps });
        left = core.binary("and", left, right, core.booleanType);
      }
      return left;
    },

    Exp2_CompareExpr(exp1, relop, exp2) {
      const [left, op, right] = [exp1.rep(), relop.sourceString, exp2.rep()];
      if (["<", "<=", ">", ">="].includes(op)) {
        mustHaveNumericOrStringType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: relop });
      return core.binary(op, left, right, core.booleanType);
    },

    Exp3_AddExpr(exp1, addOp, exp2) {
      const [left, op, right] = [exp1.rep(), addOp.sourceString, exp2.rep()];
      if (op === "+") {
        mustHaveNumericOrStringType(left, { at: exp1 });
      } else {
        mustHaveNumericType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: addOp });
      return core.binary(op, left, right, left.type);
    },

    Exp4_MulExpr(exp1, mulOp, exp2) {
      const [left, op, right] = [exp1.rep(), mulOp.sourceString, exp2.rep()];
      mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: mulOp });
      return core.binary(op, left, right, left.type);
    },

    Exp5_PrefixExpr(prefixOps, postfixExpr) {
      let expression =
        context.lookup(postfixExpr.sourceString) || postfixExpr.sourceString;
      let ops = [];

      const prefixArray = Array.isArray(prefixOps) ? prefixOps : [prefixOps];

      prefixArray.forEach((opNode) => {
        ops.push(opNode.sourceString);
      });

      const operand = postfixExpr.rep();
      let type;

      if (ops.some((op) => op === "++" || op === "--")) {
        mustHaveIntegerType(expression, { at: prefixOps });
        type = core.intType;
      }

      if (ops.includes("-")) {
        mustHaveNumericType(expression, { at: prefixOps });
        type = operand.type || core.floatType;
      }

      if (ops.includes("not")) {
        mustHaveBooleanType(expression, { at: prefixOps });
        type = core.booleanType;
      }

      return core.unary(ops, operand, type);
    },

    Exp6_PostfixExpr(baseExpr, ops) {
      const base = baseExpr.rep();
      let result = base;

      let operationList = [];

      ops = Array.isArray(ops) ? ops : [];

      ops.forEach((op) => {
        if (op.kind === "PropertyExpression") {
          const prop = op.identifier.sourceString;
          operationList.push(op.sourceString);
          result = core.propertyExpression(result, prop);
        } else if (op.kind === "FunctionCall") {
          const args = op.ArgList ? op.ArgList.rep() : [];
          operationList.push(op.sourceString);
          result = core.functionCall(result, args);
        }
      });

      return core.postfixExpression(operationList, base, result.type);
    },

    PropertyOp(_dot, id) {
      const base = this.children[0].rep();
      const prop = id.sourceString;
      return core.propertyExpression(base, prop);
    },

    CallOp(_open, ArgList, _close) {
      const callee = this.children[0].rep();
      const args = ArgList ? ArgList.rep() : [];
      return core.functionCall(callee, args);
    },

    ArgList(exp, _comma, exps) {
      const args = [exp.rep()];

      if (exps) {
        exps.forEach((e) => {
          args.push(e.rep());
        });
      }

      return args;
    },

    ParenExpr(_open, exp, _close) {
      return core.parenExpr(exp.rep());
    },

    BooleanLit(bool) {
      return Boolean(bool);
    },

    identifier(_this, _dot, firstChar, rest) {
      const name = firstChar.sourceString + rest.sourceString;
      return name;
    },

    none(_) {
      return core.noneType;
    },

    // VARIABLES AND TYPES
    Type(type) {
      return type.rep();
    },

    BasicType(basic) {
      switch (basic.sourceString) {
        case "str":
          return core.stringType;
        case "num":
          return core.numType;
        case "bool":
          return core.booleanType;
        case "none":
          return core.noneType;
      }
    },

    UnionType(left, _bar, right) {
      return core.unionType(left.rep(), right.rep());
    },

    LValue(firstId, _dot, rest) {
      let base = firstId.sourceString;

      for (let dotAndId of rest.children) {
        const prop = dotAndId.children[1].sourceString;
        base = core.propertyExpression(base, prop);
      }

      return base;
    },

    _iter(...children) {
      return children.map((child) => child.rep());
    },

    _terminal() {
      const value = this.sourceString;
      return value;
    },

    number(_whole, _point, _fraction, _e, _digits) {
      // only have numbers
      return Number(this.sourceString);
    },

    string(_openQuote, _chars, _closeQuote) {
      // Carlos strings will be represented as plain JS strings, including
      // the quotation marks
      return String(this.sourceString);
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
