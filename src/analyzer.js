import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    globalClassNamespace = new Map(),
    locals = new Map(),
    inLoop = false,
    class: c = null,
    def: f = null,
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

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at);
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
      (t1 === "num" && t2 === "str")
    );
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }

  function mustReturnSomething(f, at) {
    const returnsSomething = f.type.returnType !== core.voidType;
    must(returnsSomething, "Cannot return a value from this function", at);
  }

  function mustBeReturnable(e, { from: f }, at) {
    mustBeAssignable(e, { toType: f.type.returnType }, at);
  }

  function mustBeAssignable(e, { toType: type }, at) {
    const source = typeDescription(e.type);
    const target = typeDescription(type);
    const message = `Cannot assign a ${source} to a ${target}`;
    must(assignable(e.type, type), message, at);
  }

  function typeDescription(type) {
    if (typeof type === "string") return type;
  }

  function assignable(fromType, toType) {
    return (
      toType == core.anyType ||
      equivalent(fromType, toType) ||
      fromType.paramTypes.length === toType.paramTypes.length
    );
  }

  function isMutable(e) {
    return e?.kind === "Variable" && e.readonly !== "false";
  }

  function mustBeMutable(e, at) {
    must(isMutable(e), "Cannot assign to immutable variable", at);
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

      context = context.newChildContext({ inLoop: false, def: fun });

      const paramTypes = parameters.children.map((param) => {
        const paramName = param.children[0].sourceString;
        const paramType = param.children[1].rep();

        const paramTypeObj = core[paramType];
        return { name: paramName, type: paramTypeObj };
      });

      fun.params = paramTypes.map((p) => p.name);

      const returnType = type.children?.[0]?.rep();

      fun.type = core.functionType(
        paramTypes.map((p) => p.type),
        returnType
      );

      fun.body = block.rep();

      context = context.parent;

      return core.functionDeclaration(fun);
    },

    ConstructorDecl(_def, __init__, _left, parameters, _right, block) {
      const constructor = core.constructor(context.class, "init");
      context.assignClassNamespace("init", constructor);

      context = context.newChildContext({
        inLoop: false,
        def: constructor,
      });
      constructor.params = parameters.rep();

      const paramTypes = constructor.params.map((param) => param.type);

      constructor.body = block.rep();

      constructor.type = core.constructorType(paramTypes);

      context = context.parent;
      context.class.constructor = constructor;
      return core.constructorDeclaration(constructor);
    },

    ReturnStmt_longReturn(_return, exp) {
      mustBeInAFunction({ at: _return });
      mustReturnSomething(context.function, { at: _return });
      let returnExp = exp.rep();
      mustBeReturnable(returnExp, { from: context.function }, { at: exp });
      return core.returnStatement(returnExp);
    },

    ReturnStmt_shortReturn(_return) {
      mustBeInAFunction({ at: _return });
      return core.shortReturnStatement;
    },

    VarDecl(modifier, id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });

      const readonly = modifier.sourceString === "readonly";
      const classAffil = context.class;
      const name = id.sourceString;
      const initializer = exp.rep();
      const variable = core.variable(readonly, classAffil, name, type.rep());

      context.add(id.sourceString, variable);

      if (classAffil) {
        context.assignClassNamespace(name, variable);
      }

      return core.variableDeclaration(variable, initializer);
    },

    Assignment(lval, _eq, expr) {
      const target = lval.rep();
      const source = expr.rep();
      mustBeAssignable(
        source,
        { toType: context.lookup(target).type },
        { at: lval }
      );
      mustBeMutable(context.lookup(target), { at: lval });
      const entity = context.lookup(lval.sourceString);
      mustHaveBeenFound(entity, lval.sourceString, { at: lval });
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

      const finalBlock = final.rep();

      return core.ifStatement(test, consequentBlock, finalBlock);
    },

    Params(param, _comma, paramList) {
      const params = [param.rep(), ...paramList.children.map((p) => p.rep())];
      return params;
    },

    Param_regParam(id, _colon, type) {
      const param = core.variable(false, context.class, id, type.rep());
      mustNotAlreadyBeDeclared(param.name, { at: id });
      context.add(param.name, param);
      return param;
    },

    BreakStmt(breakKeyword) {
      mustBeInLoop({ at: breakKeyword });
      return core.breakStatement;
    },

    // EXPR

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
      }
      mustBothHaveTheSameType(left, right, { at: addOp });
      return core.binary(op, left, right, left.type);
    },

    Exp5_PrefixExpr(prefixOps, postfixExpr) {
      let expression = context.lookup(postfixExpr.sourceString);
      let ops = [];

      const prefixArray = [prefixOps];

      prefixArray.forEach((opNode) => {
        ops.push(opNode.sourceString);
      });

      const operand = postfixExpr.rep();
      let type;

      if (ops.some((op) => op === "++" || op === "--")) {
        mustHaveIntegerType(expression, { at: prefixOps });
        type = core.intType;
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

      ops = ops;

      return core.postfixExpression(operationList, base, result.type);
    },

    ParenExpr(_open, exp, _close) {
      return core.parenExpr(exp.rep());
    },

    BooleanLit(_) {
      return core.booleanType;
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
      return Number(this.sourceString);
    },

    string(_openQuote, _chars, _closeQuote) {
      return String(this.sourceString);
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
