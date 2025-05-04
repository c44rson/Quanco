const regexes = {

    canadianPostalCode: /^[ABCEGHJKLMNPRSTVWXYZ][0-9][ABCEGHJKLMNPRSTVWXYZ] [0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/,
    visa: /^4(\d{12}|\d{15})$/,
    masterCard: /^(5[1-5]\d{14}|2(22[1-9]|2[3-9]\d|[3-6]\d\d|7[0-1]\d|720)\d{12})$/,
    notThreeEndingInOO: /^(?!^[a-zA-Z][oO]{2}$)[a-zA-Z]*$/iu,
    divisibleBy16: /^(0{1,3}|[01]*0{4,})$/,
    eightThroughThirtyTwo: /^(8|9|[1-2][0-9]|3[0-2])$/,
    notPythonPycharmPyc: /^(?!python$|pycharm$|pyc$)\p{L}*$/u,
    restrictedFloats: /^[0-9]+(\.[0-9]+)?[eE][+-]?[0-9]{1,3}$/i,
    palindromes2358: /^(?:([abc])\1|([abc])[abc]\2|([abc])([abc])[abc]\4\3|([abc])([abc])([abc])([abc])\8\7\6\5)$/,
    pythonStringLiterals: /^(?:[fF]?(?:'''(?:[^'\\]|\\.|'[^']|''[^'])*'''|"""(?:[^"\\]|\\.|"[^"]|""[^"])*"""|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))$/,

}

export function matches(name, string) {
    return regexes[name].test(string)
}