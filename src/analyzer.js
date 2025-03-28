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
  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

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

    VarDecl(modifier, _this, _period, id, _colon, type, _eq, exp) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      const readonly = modifier.sourceString === "readonly";
      const classAffil = context.class; // FIX LATER
      const name = id.sourceString;
      const initializer = exp.rep();
      const variable = core.variable(readonly, classAffil, name, type);
      context.add(id.sourceString, variable);
      context.assignClassNamespace(classAffil, name);
      return core.variableDeclaration(variable, initializer);
    },
  });
  /* One line to run it */
  return builder(match).rep();
}
