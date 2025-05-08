import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    global = new Map(),
    locals = new Map(),
    inLoop = false,
    class: c = null,
    def: f = null,
  }) {
    Object.assign(this, {
      parent,
      global,
      locals,
      inLoop,
      class: c,
      function: f,
    });
  }
  add(name, entity) {
    this.locals.set(name, entity);
  }
  assignCategory(id, entity) {
    this.global.set(id, entity);
  }
  assignAttribute(category, attr) {
    this.global.get(category).attributes.set(attr.name, attr);
  }
  assignMethod(category, method) {
    this.global.get(category).methods.set(method.name, method);
  }
  lookup(name) {
    if (typeof name === "string") {
      if (!name.indexOf("this.")) {
        name = name.split(".")[1];
      }
    }
    return (
      this.locals.get(name) ||
      this.global.get(name) ||
      this.class?.attributes.get("this." + name) ||
      this.class?.methods.get(name)
    );
  }
  static root() {
    return new Context({
      locals: new Map(),
    });
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this });
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
  function evaluateIteratively(root) {
    let current = root;
    const stack = [];

    while (current.kind === "BinaryExpression") {
      stack.push(current);
      current = current.left;
    }

    let result = evaluateLeaf(current);

    while (stack.length > 0) {
      const node = stack.pop();
      const rightVal = evaluateLeaf(node.right);

      switch (node.op) {
        case "+":
          result += rightVal;
          break;
        case "-":
          result -= rightVal;
          break;
        case "*":
          result *= rightVal;
          break;
        case "/":
          result /= rightVal;
          break;
      }
    }

    return result;
  }

  function evaluateLeaf(node) {
    switch (node.kind) {
      case undefined:
        return node;
      case "Variable":
        return node.value[0];
      case "BinaryExpression":
        return evaluateIteratively(node);
    }
  }

  // MUST RULES
  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at);
  }

  function mustBeTheSameEntity(e1, e2, at) {
    must(e1 === e2, `Entities must match in loop definition`, at);
  }

  function mustNotBeInfiniteForLoop(it, con, step, at) {
    let itRootValue = it.variable.value[0];

    let conRootValue = con.right;

    const finalIteratorValue = evaluateIteratively(itRootValue);
    const finalConValue = evaluateIteratively(conRootValue);

    let greaterThanOrEqual = finalIteratorValue >= finalConValue;

    const positiveStepOperators = ["++", "+"];
    const positiveConOperators = [">=", ">"];

    let posStepOp = positiveStepOperators.includes(step.op);
    let posConOp = positiveConOperators.includes(con.op);

    let infinite = greaterThanOrEqual && posStepOp && posConOp;
    must(!infinite, `Infinite loop detected`, at);
  }

  function mustBeExecutableLoop(it, con, at) {
    let itRootValue = it.variable.value[0];
    let conRootValue = con.right;

    var finalIteratorValue = evaluateIteratively(itRootValue);
    var finalConValue = evaluateIteratively(conRootValue);

    let overlap = false;

    switch (con.op) {
      case "==":
        overlap = finalIteratorValue === finalConValue;
        break;
      case "!=":
        overlap = finalIteratorValue !== finalConValue;
        break;
      case ">":
        overlap = finalIteratorValue > finalConValue;
        break;
      case ">=":
        overlap = finalIteratorValue >= finalConValue;
        break;
      case "<":
        overlap = finalIteratorValue < finalConValue;
        break;
      case "<=":
        overlap = finalIteratorValue <= finalConValue;
        break;
    }
    must(overlap, `Loop never executes`, at);
  }

  function mustNotAlreadyBeDefined(name, at) {
    must(!context.lookup(name), `Identifier ${name} already defined`, at);
  }

  function mustHaveBeenFound(name, at) {
    let found =
      context.lookup(name) ||
      context.class?.attributes.get(name) ||
      context.class?.methods.get(name);
    must(found, `Identifier ${name} not defined`, at);
  }

  function mustHaveAValue(name, at) {
    must(context.lookup(name)?.value, `Identifier ${name} not declared`, at);
  }

  function mustHaveNumericType(e, at) {
    const expectedTypes = [core.numType];

    if (typeof e === "number") {
      e = e.type;
    }

    if (e.kind) {
      let theType = e.type;
      must(expectedTypes.includes(theType), "Expected a number", at);
      return theType;
    } else {
      let theType = e;
      must(expectedTypes.includes(theType), "Expected a number", at);
      return theType;
    }
  }

  function mustHaveNumericOrStringType(e, at) {
    const expectedTypes = [core.numType, core.stringType];

    if (typeof e === "number") {
      e = e.type;
    }

    if (e.kind) {
      let theType = e.type;
      must(expectedTypes.includes(theType), "Expected a number or string", at);
      return theType;
    } else {
      var theType;
      if (expectedTypes.includes(e)) {
        theType = e;
      } else {
        theType = e.type;
      }
      must(expectedTypes.includes(theType), "Expected a number or string", at);
      return theType;
    }
  }

  function mustHaveBooleanType(e, at) {
    const expectedTypes = [core.booleanType];
    if (
      e.kind === "Variable" ||
      e.kind === "BinaryExpression" ||
      typeof e === "boolean"
    ) {
      let theType = e.type;
      must(expectedTypes.includes(theType), "Expected a boolean", at);
      return theType;
    } else {
      let theType = e;
      must(expectedTypes.includes(theType), "Expected a boolean", at);
      return theType;
    }
  }

  function mustBeBooleanOp(e, at) {
    const expectedOps = ["==", "!=", "<=", "<", ">=", ">"];
    must(expectedOps.includes(e), `Operator ${e} not a boolean operator`, at);
  }

  function mustBeStepOp(e, at) {
    const expectedOps = ["--", "-", "++", "+"];
    must(expectedOps.includes(e), `Operator ${e} not a step operator`, at);
  }

  function mustBothHaveTheSameType(e1, e2, at) {
    must(equivalent(e1, e2), "Operands do not have the same type", at);
  }

  function equivalent(t1, t2) {
    const type = ["num", "bool"];
    const types = ["number", "boolean"];
    if (t2.kind === "PropertyExpression" && t2.base.kind === "Category") {
      context.class = t2.base;
      t2 = context.lookup(t2.prop);
      context.class = null;
      return equivalent(t1, t2);
    }
    if (t2.kind === "PropertyExpression") {
      return equivalent(t1, t2.prop);
    }
    if (t1.kind === "BinaryExpression") {
      return equivalent(t1.type, t2);
    }
    if (t2.kind === "BinaryExpression") {
      return equivalent(t1, t2.type);
    }
    if (t2.kind === "UnaryExpression") {
      return equivalent(t1, t2.type);
    }
    if (t2.kind === "ConstructorCall") {
      return equivalent(t1, t2.callee.name);
    }
    if (t2.kind === "PostfixExpression") {
      return equivalent(t1, t2.type);
    }
    if (t1.kind === "UnionType") {
      return equivalent(t1.firstType, t2) || equivalent(t1.secondType, t2);
    }
    if (t2.kind === "UnionType") {
      return equivalent(t1, t2.firstType) || equivalent(t1, t2.secondType);
    }
    if (t1.kind === "Variable") {
      return equivalent(t1.type, t2);
    }
    if (t2.kind === "Variable") {
      return equivalent(t1, t2.type);
    }
    if (types.includes(typeof t1)) {
      return equivalent(t1.type, t2);
    }
    if (types.includes(typeof t2)) {
      return equivalent(t1, t2.type);
    }

    const e1 = context.lookup(t1)
      ? context.lookup(t1)
      : type.includes(t1)
        ? t1
        : t1.type;
    const e2 = context.lookup(t2)
      ? context.lookup(t2)
      : type.includes(t2)
        ? t2
        : t1.type;
    return e1 === e2;
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }

  function mustBeInAClass(at) {
    must(context.class, "__init__ can only be used in a class", at);
  }

  function mustBeAClass(e, at) {
    must(e && e.kind === "Category", `${e} is not a class`, at);
  }

  function mustBeCompatibleArguments(args, params, at) {
    mustHaveTheCorrectNumberOfArguments(args, params, at);
    mustHaveMatchingParamsAndArguments(args, params, at);
  }

  function mustHaveTheCorrectNumberOfArguments(args, params, at) {
    params = params ? params : [];
    must(
      args.length === params.length,
      `${params.length} arguments expected, ${args.length} given`,
      at
    );
  }

  function mustHaveMatchingParamsAndArguments(args, params, at) {
    let compatible = true;
    let arg;
    let p;
    params?.forEach((param, idx) => {
      let argument = context.lookup(args[idx])
        ? context.lookup(args[idx])
        : args[idx];

      if (param.type !== argument.type) {
        compatible = false;
        arg = args[idx];
        p = param.name;
      }
    });
    must(
      compatible,
      `Argument ${arg} is not compatible with parameter ${p}`,
      at
    );
  }

  function mustReturnSomething(f, at) {
    const returnsSomething = f.type !== core.voidType;
    must(returnsSomething, "Cannot return a value from this function", at);
  }

  function mustHaveReturn(f, at) {
    const returnsSomething = f.type !== core.voidType;
    must(!returnsSomething, "This function requires a return value", at);
  }

  function mustBeReturnable(e, { from: f }, at) {
    mustBeAssignable(e, { toType: f.type }, at);
  }

  function mustBeAssignable(e, { toType: type }, at) {
    let source = e;
    const target = type;
    const message = `Cannot assign a ${source.type} to a ${target}`;
    must(equivalent(source, target), message, at);
  }

  function isMutable(e) {
    return e?.kind === "Variable" && e.readonly !== true;
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
      return statements.children.map((s) => s.rep());
    },

    /* Definitions of the semantic actions */
    ClassDecl(_class, id, block) {
      mustNotAlreadyBeDefined(id.sourceString, { at: id });
      const category = core.category(id.sourceString, new Map(), new Map());

      context.add(id.sourceString, category);
      context.assignCategory(id.sourceString, category);

      context = context.newChildContext({
        locals: new Map(),
        inLoop: false,
        class: category,
      });

      category.body = block.rep();

      context = context.parent;

      return core.classDeclaration(category);
    },

    FunctionDecl(_def, id, _left, parameters, _right, _arrow, type, block) {
      mustNotAlreadyBeDefined(id.sourceString, { at: id });
      const fun = core.fun(id.sourceString);

      if (context.class) {
        context.assignMethod(context.class.name, fun);
      }
      context.add(id.sourceString, fun);
      context = context.newChildContext({
        locals: new Map(),
        inLoop: false,
        def: fun,
      });

      context.add(id.sourceString, fun);

      fun.params = parameters.children[0]?.rep();

      fun.type = type.rep();

      fun.body = block.rep();

      context = context.parent;

      return core.functionDeclaration(fun);
    },

    ConstructorDecl(_def, __init__, _left, parameters, _right, block) {
      mustNotAlreadyBeDefined(__init__.sourceString, { at: __init__ });
      mustBeInAClass({ at: __init__ });
      const fun = core.fun(__init__.sourceString);

      fun.type = core.noneType;

      context.class.params = parameters.children[0]?.rep();

      fun.body = block.rep();

      context.class.constructor = fun;

      return fun;
    },

    Params(param, _comma, paramList) {
      const params = [param.rep(), ...paramList.children.map((p) => p.rep())];
      return params;
    },

    Param_regParam(id, _colon, type, _eq, value) {
      const param = core.variable(
        false,
        id.sourceString,
        type.rep(),
        value.rep()
      );
      mustNotAlreadyBeDefined(param.name, { at: id });
      context.add(param.name, param);
      return param;
    },

    Param_self(self) {
      return "self";
    },

    ReturnType(type) {
      if (type.sourceString === "void") {
        return core.voidType;
      } else if (type.sourceString === "bool") {
        return core.booleanType;
      } else if (type.sourceString === "num") {
        return core.numType;
      } else {
        return core.stringType;
      }
    },

    ReturnStmt_longReturn(_return, exp) {
      mustBeInAFunction({ at: _return });
      mustReturnSomething(context.function, { at: _return });
      let returnL = context.lookup(exp.sourceString);
      let returnExp = returnL ? returnL : exp.rep();
      mustBeReturnable(returnExp, { from: context.function }, { at: exp });
      return core.returnStatement(returnExp);
    },

    ReturnStmt_shortReturn(_return) {
      mustBeInAFunction({ at: _return });
      mustHaveReturn(context.function, { at: _return });
      return core.shortReturnStatement;
    },

    VarDecl(modifier, id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDefined(id.sourceString, { at: id });

      const readonly = modifier.sourceString === "readonly";
      const name = id.sourceString;
      const typeR = type.rep();
      const initializerL = context.lookup(
        exp.sourceString.split("=")[1]?.trim()
      )
        ? context.lookup(exp.sourceString.split("=")[1]?.trim())
        : context.lookup(exp.sourceString.split(".")[1]?.trim());

      var initializer = initializerL ? initializerL : exp.rep();

      if (initializer.kind === "Variable") {
        mustBothHaveTheSameType(typeR, initializer, { at: exp });
      } else if (
        initializer[0]?.kind === "PostfixExpression" &&
        initializer[0].type?.kind === "ConstructorCall"
      ) {
        context.class = initializer[0].type.callee;
        let init = initializer[0].base.name;
        mustBothHaveTheSameType(typeR, init, {
          at: exp,
        });
        context.class = null;
      } else {
        initializer.forEach((child) => {
          mustBothHaveTheSameType(typeR, child, { at: exp });
        });
      }

      const variable = core.variable(readonly, name, typeR, initializer);

      context.add(id.sourceString, variable);
      if (context.class) {
        context.assignAttribute(context.class.name, variable);
      }

      return core.variableDeclaration(variable, initializer);
    },

    Assignment(lval, _eq, expr) {
      let target;
      if (lval.sourceString.includes(".") && context.class === null) {
        const [name] = lval.sourceString.split(".");
        mustHaveBeenFound(name, { at: lval });
        const globalClassName = context.locals.get(name).type;

        mustBeAClass(context.lookup(globalClassName), { at: lval });
        const category = context.lookup(globalClassName);
        context.class = category;

        mustHaveBeenFound(lval.sourceString.split(".")[1], {
          at: lval,
        });
        target = context.lookup(lval.sourceString.split(".")[1]);
        context.class = null;
      } else {
        mustHaveBeenFound(lval.sourceString, { at: lval });
      }
      const sourceL = context.lookup(expr.sourceString);

      target = target ? target : context.lookup(lval.sourceString);
      const source = sourceL ? sourceL : expr.rep();
      mustBothHaveTheSameType(target.type, source, { at: expr });
      mustBeMutable(target, { at: lval });
      target.value = source;
      return core.assignment(target, source);
    },

    // STATEMENTS
    ForLoop(_for, varDecl, _comma1, condition, _comma2, unaryExpr, body) {
      const iterator = varDecl.rep();

      const conditionExpr = condition.rep();
      mustBeBooleanOp(conditionExpr.op, { at: condition });

      const step = unaryExpr.rep();
      mustBeStepOp(step.op, { at: unaryExpr });

      if (iterator.variable.value.kind === "Variable") {
        mustHaveAValue(iterator.variable.value.name, { at: varDecl });
      } else {
        mustHaveAValue(iterator.variable.name, { at: varDecl });
        mustBeExecutableLoop(iterator, conditionExpr, { at: _for });
        mustNotBeInfiniteForLoop(iterator, conditionExpr, step, { at: _for });
      }

      mustHaveNumericType(iterator.variable, { at: varDecl });

      mustBeTheSameEntity(iterator.variable, conditionExpr.left, {
        at: condition,
      });
      mustBeTheSameEntity(iterator.variable, step.operand, {
        at: unaryExpr,
      });

      context.inLoop = true;
      const bodyBlock = body.rep();
      context.inLoop = false;

      return core.forStatement(iterator, conditionExpr, step, bodyBlock);
    },

    WhileLoop(_while, condition, block) {
      const test = condition.rep();

      mustHaveBooleanType(test, { at: condition });

      context.inLoop = true;
      const body = block.rep();
      context.inLoop = false;

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

      mustHaveBooleanType(test, { at: condition });

      const alternates = elif_conditions.children.map((e, idx) => {
        const elifCondition = e.rep();
        mustHaveBooleanType(elifCondition, { at: e });

        const elifBlock = elif_blocks.children[idx].rep();
        return core.elifStatement(elifCondition, elifBlock);
      });

      const finalBlock = final.rep();

      return core.ifStatement(test, consequentBlock, alternates, finalBlock[0]);
    },

    BreakStmt(breakKeyword) {
      mustBeInLoop({ at: breakKeyword });
      return core.breakStatement;
    },

    // EXPR
    Exp_OrExpr(exp, _ops, exps) {
      const exp1L = context.lookup(exp.sourceString);
      let left = exp1L ? exp1L : exp.rep();

      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        const exp2L = context.lookup(e.sourceString);
        let right = exp2L ? exp2L : e.rep();
        mustHaveBooleanType(right, { at: exps });
        left = core.binary("or", left, right, core.booleanType);
      }
      return left;
    },

    Exp1_AndExpr(exp, _ops, exps) {
      const exp1L = context.lookup(exp.sourceString);
      let left = exp1L ? exp1L : exp.rep();

      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        const exp2L = context.lookup(e.sourceString);
        let right = exp2L ? exp2L : e.rep();
        mustHaveBooleanType(right, { at: exps });
        left = core.binary("and", left, right, core.booleanType);
      }
      return left;
    },

    Exp2_CompareExpr(exp1, relop, exp2) {
      const exp1L = context.lookup(exp1.sourceString);
      const exp2L = context.lookup(exp2.sourceString);
      let [left, op, right] = [
        exp1L ? exp1L : exp1.rep(),
        relop.sourceString,
        exp2L ? exp2L : exp2.rep(),
      ];

      if (["<", "<=", ">", ">="].includes(op)) {
        mustHaveNumericOrStringType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: relop });
      return core.binary(op, left, right, core.booleanType);
    },

    Exp3_AddExpr(exp1, addOp, exp2) {
      const exp1L = context.lookup(exp1.sourceString);
      const exp2L = context.lookup(exp2.sourceString);
      let [left, op, right] = [
        exp1L ? exp1L : exp1.rep(),
        addOp.sourceString,
        exp2L ? exp2L : exp2.rep(),
      ];

      if (op === "+") {
        const type = mustHaveNumericOrStringType(left, { at: exp1 });
        return core.binary(op, left, right, type);
      } else {
        const type = mustHaveNumericType(left, { at: exp1 });
        mustBothHaveTheSameType(left, right, { at: addOp });
        return core.binary(op, left, right, type);
      }
    },

    Exp4_MulExpr(exp1, mulOp, exp2) {
      const exp1L = context.lookup(exp1.sourceString);
      const exp2L = context.lookup(exp2.sourceString);
      let [left, op, right] = [
        exp1L ? exp1L : exp1.rep(),
        mulOp.sourceString,
        exp2L ? exp2L : exp2.rep(),
      ];

      const type = mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: mulOp });
      return core.binary(op, left, right, type);
    },

    Exp5_PrefixExpr(prefixOp, postfixExpr) {
      let expression = context.lookup(postfixExpr.sourceString)
        ? context.lookup(postfixExpr.sourceString)
        : postfixExpr.rep();

      if (prefixOp.sourceString === "++" || prefixOp.sourceString === "--") {
        const type = mustHaveNumericType(expression, { at: postfixExpr });
        return core.unary(prefixOp.sourceString, expression, type);
      }

      if (prefixOp.sourceString === "not") {
        const type = mustHaveBooleanType(expression, { at: prefixOp });
        return core.unary(prefixOp.sourceString, expression, type);
      }
    },

    Exp6_PostfixExpr(baseExpr, ops) {
      if (this.sourceString.split("(")[0] === "print") {
        let args = [];
        for (let i = 0; i < ops.children.length; i++) {
          let op = ops.children[i].rep();
          op = context.lookup(op[0]) ? context.lookup(op[0]) : op;
          args.push(op);
        }
        return core.print(args);
      }

      mustHaveBeenFound(baseExpr.sourceString, { at: baseExpr });
      const base = context.lookup(baseExpr.sourceString);
      let result = base;
      let callee = base;
      let operationList = [];
      if (base.kind === "Category") {
        if (ops.sourceString === "()") {
          var op = [];
        } else {
          var op = ops.children[0].rep();
        }

        if (Array.isArray(op)) {
          for (let i = 0; i < callee.params?.length; i++) {
            if (callee.params[i] === "self") {
              callee.params.shift();
            }
          }
          mustBeCompatibleArguments(op, callee.params, { at: ops });
          operationList.push(core.constructorCall(base, op));
          if (this.sourceString.indexOf(".") !== -1) {
            op = this.sourceString.split(".")[1];
            context.class = context.lookup(base.name);
            mustHaveBeenFound(op, { at: ops });
            context.class = null;
            operationList.push(core.propertyExpression(base, op));
          }
        } else {
          let globalClass = context.lookup(base.name);
          if (globalClass) {
            context.class = globalClass;
            mustHaveBeenFound(op, { at: ops });
            op = context.lookup(op);
            context.class = null;
          }
          operationList.push(core.propertyExpression(base.name, op));
          callee = op;
        }
        return core.postfixExpression(
          operationList,
          base,
          operationList[operationList.length - 1]
        );
      } else {
        for (let i = 0; i < ops.children.length; i++) {
          let op = ops.children[i].rep() ? ops.children[i].rep() : [];
          if (Array.isArray(op)) {
            mustBeCompatibleArguments(op, callee.params, { at: ops });
            operationList.push(core.functionCall(callee, op));
          }
        }
        return core.postfixExpression(operationList, base, result.type);
      }
    },

    PropertyOp(_dot, id) {
      const prop = id.sourceString;
      return prop;
    },

    CallOp(_open, ArgList, _close) {
      let args = ArgList.rep();
      args = args[0];
      return args;
    },

    ArgList(exp, _comma, exps) {
      const args = [exp.rep()];
      for (let e of exps.children) {
        args.push(e.rep());
      }
      return args;
    },

    ParenExpr(_open, exp, _close) {
      return exp.rep();
    },

    identifier(_this, _dot, firstChar, rest) {
      let name;
      name = firstChar.sourceString + rest.sourceString;
      mustHaveBeenFound(name, { at: firstChar });
      return name;
    },

    // VARIABLES AND TYPES
    Type(type) {
      return type.rep();
    },

    UnionType(left, _bar, right) {
      return core.unionType(left.rep(), right.rep());
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

    _iter(...children) {
      return children.map((child) => child.rep());
    },

    number(_neg, _whole, _point, _fraction, _e, _digits) {
      return Number(this.sourceString);
    },

    string(_openQuote, _chars, _closeQuote) {
      return this.sourceString;
    },

    BooleanLit(_) {
      if (this.sourceString === "false") {
        return false;
      } else {
        return true;
      }
    },

    none(_) {
      return core.noneType;
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
