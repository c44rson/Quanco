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
      locals,
      attributes,
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
      name in this.globalClassNameSpace ||
      this.parent?.lookup(name)
    );
  }
  lookupClassName(className) {
    return className in this.globalClassNamespace;
  }
  lookupClassItem(className, id) {
    return id in this.globalClassNamespace[className];
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
  function equivalent(t1, t2) {
    return (
      t1 === t2 ||
      (t1?.kind === "ListType" &&
        t2?.kind === "ListType" &&
        equivalent(t1.baseType, t2.baseType)) ||
      (t1?.kind === "FunctionType" &&
        t2?.kind === "FunctionType" &&
        equivalent(t1.returnType, t2.returnType) &&
        t1.paramTypes.length === t2.paramTypes.length &&
        t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
    );
  }

  function assignable(fromType, toType) {
    return (
      toType == core.anyType ||
      equivalent(fromType, toType) ||
      (fromType?.kind === "FunctionType" &&
        toType?.kind === "FunctionType" &&
        // covariant in return types
        assignable(fromType.returnType, toType.returnType) &&
        fromType.paramTypes.length === toType.paramTypes.length &&
        // contravariant in parameter types
        toType.paramTypes.every((t, i) =>
          assignable(t, fromType.paramTypes[i])
        ))
    );
  }

  function typeDescription(type) {
    if (typeof type === "string") return type;
    if (type.kind == "ClassType") return type.name;
    if (type.kind == "FunctionType") {
      const paramTypes = type.paramTypes.map(typeDescription).join(", ");
      const returnType = typeDescription(type.returnType);
      return `(${paramTypes})->${returnType}`;
    }
    if (type.kind == "ListType") return `[${typeDescription(type.baseType)}]`;
  }

  function isMutable(e) {
    return (
      (e?.kind === "Variable" && e?.readonly) ||
      (e?.kind === "SubscriptExpression" && isMutable(e?.list)) ||
      (e?.kind === "MemberExpression" && isMutable(e?.object))
    );
  }

  // MUST RULES
  function mustBeAssignable(e, { toType: type }, at) {
    const source = typeDescription(e.type);
    const target = typeDescription(type);
    const message = `Cannot assign a ${source} to a ${target}`;
    must(assignable(e.type, type), message, at);
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

  function mustBothHaveTheSameType(e1, e2, at) {
    must(
      equivalent(e1.type, e2.type),
      "Operands do not have the same type",
      at
    );
  }

  function mustBeMutable(e, at) {
    must(isMutable(e), "Cannot assign to immutable variable", at);
  }

  function mustHaveDistinctFields(type, at) {
    const fieldNames = new Set(type.fields.map((f) => f.name));
    must(fieldNames.size === type.fields.length, "Fields must be distinct", at);
  }

  function mustHaveMember(classType, field, at) {
    must(
      classType.fields.map((f) => f.name).includes(field),
      "No such field",
      at
    );
  }

  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at);
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }

  function mustBeCallable(e, at) {
    const callable = e?.kind === "ClassType" || e.type?.kind === "FunctionType";
    must(callable, "Call of non-function or non-constructor", at);
  }

  function mustNotReturnAnything(f, at) {
    const returnsNothing = f.type.returnType === core.voidType;
    must(returnsNothing, "Something should be returned", at);
  }

  function mustReturnSomething(f, at) {
    const returnsSomething = f.type.returnType !== core.voidType;
    must(returnsSomething, "Cannot return a value from this function", at);
  }

  function mustBeReturnable(e, { from: f }, at) {
    mustBeAssignable(e, { toType: f.type.returnType }, at);
  }

  function mustHaveCorrectArgumentCount(argCount, paramCount, at) {
    const message = `${paramCount} argument(s) required but ${argCount} passed`;
    must(argCount === paramCount, message, at);
  }
  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.rep()));
    },

    /* Definitions of the semantic actions */
    VarDecl(modifier, identifier, _colon, Type, _eq, exp) {
      mustNotAlreadyBeDeclared(identifier.sourceString, { at: identifier });
      const initializer = exp.rep();
      const readonly = modifier.sourceString === "readonly";
      const variable = core.variable(identifier.sourceString, readonly, Type);
      context.add(identifier.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },

    ClassDecl(_class, identifier, _open, constructor, _close) {
      mustNotAlreadyBeDeclared(identifier.sourceString, { at: identifier });
      // To allow recursion, enter into context without any fields yet
      const type = core.structType(identifier.sourceString, []);
      context.add(identifier.sourceString, type);
      // Now add the types as you parse and analyze. Since we already added
      // the struct type itself into the context, we can use it in fields.
      type.fields = fields.children.map((field) => field.rep());
      mustHaveDistinctFields(type, { at: identifier });
      mustNotBeSelfContaining(type, { at: identifier });
      return core.typeDeclaration(type);
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
