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

export function constructorDeclaration(params, body, type) {
  return { kind: "ConstructorDeclaration", params, body, type };
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

export function boxFunction(name, type) {
  return { kind: "Function", name, type, box: true };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(readonly, classAffil, name, type) {
  return { kind: "Variable", readonly, classAffil, name, type };
}

// STATEMENTS
export function functionCall(callee, args) {
  if (callee.box) {
    if (callee.type.returnType === voidType) {
      return {
        kind: callee.name.replace(/^\p{L}/u, (c) => c.toUpperCase()),
        args,
      };
    } else if (callee.type.paramTypes.length === 1) {
      return unary(callee.name, args[0], callee.type.returnType);
    } else {
      return binary(callee.name, args[0], args[1], callee.type.returnType);
    }
  }
  return { kind: "FunctionCall", callee, args, type: callee.type.returnType };
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

export function member(object, op, field) {
  return { kind: "MemberExpression", object, op, field, type: field.type };
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

// TYPES
export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType };
}

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
export const intType = "int";
export const floatType = "float";
export const stringType = "str";
export const voidType = "void";
export const noneType = "none";
export const anyType = "any";

const anyToVoidType = functionType([anyType], voidType);
const anyToIntType = functionType([anyType], intType);

// STD LIBRARY
export const standardLibrary = Object.freeze({
  int: intType,
  float: floatType,
  boolean: booleanType,
  string: stringType,
  void: voidType,
  none: noneType,
  any: anyType,
  print: boxFunction("print", anyToVoidType),
  len: boxFunction("print", anyToIntType),
});

String.prototype.type = stringType;
Number.prototype.type = floatType;
BigInt.prototype.type = intType;
Boolean.prototype.type = booleanType;
