// TOP LEVEL
export function program(statements) {
  return { kind: "Program", statements };
}

export function classDeclaration(category) {
  return { kind: "ClassDeclaration", category };
}

export function category(name, methods, attributes, params, body, constructor) {
  return {
    kind: "Category",
    name,
    methods,
    attributes,
    params,
    body,
    constructor,
  };
}

export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun };
}

export function fun(name, params, body, type) {
  return { kind: "Function", name, params, body, type };
}

export function print(args) {
  return { kind: "Print", args };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(readonly, name, type, value) {
  return { kind: "Variable", readonly, name, type, value };
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source };
}

// STATEMENTS
export function functionCall(callee, args) {
  return { kind: "FunctionCall", callee, args };
}

export function constructorCall(callee, args) {
  return { kind: "ConstructorCall", callee, args };
}

export function forStatement(iterator, condition, step, body) {
  return { kind: "ForStatement", iterator, condition, step, body };
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body };
}

export function ifStatement(test, consequent, alternates, final) {
  return { kind: "IfStatement", test, consequent, alternates, final };
}

export function elifStatement(condition, body) {
  return { kind: "ElifStatement", condition, body };
}

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export const shortReturnStatement = { kind: "ShortReturnStatement" };

export const breakStatement = { kind: "BreakStatement" };

// EXPRESSIONS
export function propertyExpression(base, prop) {
  return { kind: "PropertyExpression", base, prop };
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

export function postfixExpression(ops, base, type) {
  return {
    kind: "PostfixExpression",
    ops,
    base,
    type,
  };
}

// TYPES
export function unionType(firstType, secondType) {
  return { kind: "UnionType", firstType, secondType };
}

export const booleanType = "bool";
export const numType = "num";
export const stringType = "str";
export const voidType = "void";
export const noneType = "none";
export const anyType = "any";

// STD LIBRARY
export const standardLibrary = Object.freeze({
  num: numType,
  boolean: booleanType,
  string: stringType,
  void: voidType,
  any: anyType,
  none: noneType,
});

String.prototype.type = stringType;
Boolean.prototype.type = booleanType;
Number.prototype.type = numType;
