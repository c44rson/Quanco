import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    globalClassNamespace = {},
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
  assignClassNamespace(className, id) {
    this.globalClassNamespace[className] = [
      ...(this.globalClassNamespace[className] ?? []),
      id,
    ];
  }
  lookup(name) {
    return (
      this.locals.get(name) ||
      this.globalClassNameSpace?.hasOwnProperty(name) ||
      this.parent?.lookup(name)
    );
  }
  lookupClassName(className) {
    return this.globalClassNameSpace?.hasOwnProperty(className);
  }
  lookupClassItem(className, id) {
    return (
      !!this.globalClassNamespace?.[className] &&
      id in this.globalClassNamespace[className]
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
  function mustBeInClass(at) {
    must(context.class, `self argument must be used in class`, at);
  }
  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at);
  }

  function mustHaveNumericType(e, at) {
    const expectedTypes = [core.intType, core.floatType];
    must(expectedTypes.includes(e.type), "Expected a number", at);
  }

  function mustHaveNumericOrStringType(e, at) {
    const expectedTypes = [core.intType, core.floatType, core.stringType];
    must(expectedTypes.includes(e.type), "Expected a number or string", at);
  }

  function mustHaveBooleanType(e, at) {
    must(e.type === core.booleanType, "Expected a boolean", at);
  }

  function mustHaveIntegerType(e, at) {
    must(e.type === core.intType, "Expected an integer", at);
  }

  function mustHaveListType(e, at) {
    must(e.type?.kind === "ListType", "Expected a list", at);
  }

  function mustHaveClassType(e, at) {
    must(e.type?.kind === "ClassType", "Expected a class", at);
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
      const name = id.sourceString;
      const type = core.classType(name, null, []);
      context.add(name, type);

      // Create new child context (recursion)
      context = context.newChildContext({ inLoop: false, class: name });

      type.body = block.rep();

      context = context.parent;

      return core.classDeclaration(type);
    },

    FunctionDecl(_def, id, _left, parameters, _right, type, block) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      const fun = core.fun(context.class, id.sourceString);

      if (context.class) {
        context.assignClassNamespace(context.class, id);
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

    Params(_self, _comma, paramList) {
      // Returns a list of variable nodes
      return paramList.asIteration().children.map((p) => p.rep());
    },

    Param(id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDeclared(param.name, { at: id });
      const param = core.variable(
        false,
        context.class,
        id.sourceString,
        type.rep()
      );
      const initializer = exp.rep();

      context.add(param.name, param);

      return core.variableDeclaration(variable, initializer);
    },

    VarDecl(modifier, id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });

      const readonly = modifier.sourceString === "readonly";
      const classAffil = context.class;
      const name = id.sourceString;
      const initializer = exp.rep();
      const variable = core.variable(readonly, classAffil, name, type);

      context.add(id.sourceString, variable);

      if (classAffil) {
        context.assignClassNamespace(classAffil, name);
      }

      return core.variableDeclaration(variable, initializer);
    },

    // VARIABLE STUFF
    _terminal() {
      return this.sourceString; // This prevents the missing semantic action error
    },

    true(_) {
      return true;
    },

    false(_) {
      return false;
    },

    number(_whole, _point, _fraction, _e, _sign) {
      // Carlos floats will be represented as plain JS numbers
      return Number(this.sourceString);
    },

    string(_openQuote, _chars, _closeQuote) {
      // Carlos strings will be represented as plain JS strings, including
      // the quotation marks
      return this.sourceString;
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
