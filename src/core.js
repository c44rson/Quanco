// TOP LEVEL
export function program(statements) {
  return { kind: "Program", statements };
}

export function classDeclaration(type) {
  return { kind: "ClassDeclaration", type };
}

export function classType(name, constructor, body) {
  return { kind: "ClassType", name, constructor, body };
}

export function constructorDeclaration(constructor) {
  return { kind: "ConstructorDeclaration", constructor };
}

export function constructor(params, body, type) {
  return { kind: "Constructor", params, body, type };
}

export function constructorType(paramTypes) {
  return { kind: "ConstructorType", paramTypes };
}

export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun };
}

export function fun(classAffil, name, params, body, type) {
  return { kind: "Function", classAffil, name, params, body, type };
}

export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(readonly, classAffil, name, type) {
  return { kind: "Variable", readonly, classAffil, name, type };
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source };
}

// STATEMENTS
export function functionCall(callee, args) {
  return { kind: "FunctionCall", callee, args };
}

export function constructorCall(callee, args) {
  return { kind: "ConstructorCall", callee, args, type: callee };
}

export function forStatement(iterator, collection, body) {
  return { kind: "ForStatement", iterator, collection, body };
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body };
}

export function ifStatement(test, consequent, alternates, final) {
  return { kind: "IfStatement", test, consequent, alternates, final };
}

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export const shortReturnStatement = { kind: "ShortReturnStatement" };

export const breakStatement = { kind: "BreakStatement" };

// EXPRESSIONS
export function listExpression(elements) {
  return { kind: "ListExpression", elements, type: listType(elements[0].type) };
}

export function dictExpression(pairs) {
  return {
    kind: "DictExpression",
    pairs,
    key_type: dictKeyType(pairs[0].type),
    value_type: dictValueType(pairs[1].type),
  };
}

export function subscript(list, start, stop) {
  return {
    kind: "SubscriptExpression",
    list,
    start,
    stop,
    type: list.type.baseType,
  };
}

export function propertyExpression(base, prop) {
  return { kind: "PropertyExpression", base, prop };
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function unary(ops, operand, type) {
  return { kind: "UnaryExpression", ops, operand, type };
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
export function listType(baseType) {
  return { kind: "ListType", baseType };
}

export function emptyList(type) {
  return { kind: "EmptyList", type };
}

export function dictKeyType(baseType) {
  return { kind: "DictKeyType", baseType };
}

export function dictValueType(baseType) {
  return { kind: "DictValueType", baseType };
}

export function emptyDict(type) {
  return { kind: "EmptyDict", type };
}

export function unionType(firstType, secondType) {
  return { kind: "UnionType", firstType, secondType };
}

export const booleanType = "bool";
export const numType = "num";
export const floatType = "float";
export const stringType = "str";
export const voidType = "void";
export const noneType = "none";

// STD LIBRARY
export const standardLibrary = Object.freeze({
  num: numType,
  float: floatType,
  boolean: booleanType,
  string: stringType,
  void: voidType,
  none: noneType,
});

String.prototype.type = stringType;
Number.prototype.type = floatType;
Boolean.prototype.type = booleanType;
