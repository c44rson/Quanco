import { describe, it } from "node:test"
import assert from "assert"
import * as ohm from "ohm-js"

const grammars = {
    canadianPostalCode: String.raw`
        start = char d char " " d char d
        char = ~("D"|"F"|"I"|"O"|"Q"|"U") up
        up = "A"|"B"|"C"|"E"|"G"|"H"|"J"|"K"|"L"|"M"|"N"|"P"|"R"|"S"|"T"|"V"|"W"|"X"|"Y"|"Z"
        d = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"
    `,

    visa: String.raw`
        start = "4" digits
        digits = fifteenDigits | twelveDigits
        fifteenDigits = d d d d d d d d d d d d d d d
        twelveDigits = d d d d d d d d d d d d
        d = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"
    `,

    masterCard: String.raw`
        start = firstPattern | secondPattern
        firstPattern = ("51"|"52"|"53"|"54"|"55") rest
        secondPattern = "2" twoDigits twoOneDigits rest2
        twoDigits = "2" ("2"|"3"|"4"|"5"|"6"|"7")
                  | "3" ("0"|"1"|"2"|"3"|"4"|"5"|"6"|"7")
                  | "4" ("0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9")
                  | "5" ("0"|"1"|"2"|"3"|"4"|"5"|"6"|"7")
                  | "6" ("0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9")
                  | "7" ("0"|"1"|"2")
        twoOneDigits = d
        rest = d d d d d d d d d d d d d d
        rest2 = d d d d d d d d d d d d
        d = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"
    `,

    notThreeEndingInOO: String.raw`
        start = ~(validLetter ("o"|"O") ("o"|"O") ~validLetter) validLetter*
        validLetter = "A".."Z" | "a".."z"
    `,

    divisibleBy16: String.raw`
        Start = AllZeros | EndInFourZeros
        AllZeros = "0"+
        EndInFourZeros = d+ "0000"
        d = "0"|"1"
    `,

    eightThroughThirtyTwo: String.raw`
        start = "8"|"9"|"10"|"11"|"12"|"13"|"14"|"15"|"16"|"17"|"18"|"19"|"20"|
                "21"|"22"|"23"|"24"|"25"|"26"|"27"|"28"|"29"|"30"|"31"|"32"
    `,

    notPythonPycharmPyc: String.raw`
        start = ~("python" endOfWord | "pycharm" endOfWord | "pyc" endOfWord) validLetter*
        validLetter = "\u{0041}".."\u{10FFFF}"
        endOfWord = ~validLetter
    `,

    restrictedFloats: String.raw`
        start = number "e" ("+" | "-")? expDigit expDigit? expDigit?
        number = numDigit+ ("." numDigit*)?
        numDigit = "0".."9"
        expDigit = "0".."9"
    `,

    palindromes2358: String.raw`
        start = len8 | len5 | len3 | len2
        
        len8 = "a" rest6 "a" | "b" rest6 "b" | "c" rest6 "c"   
        len5 = "a" len3 "a" | "b" len3 "b" | "c" len3 "c"    
        len3 = "a" char "a" | "b" char "b" | "c" char "c"   
        len2 = "a" "a" | "b" "b" | "c" "c"
    
        rest6 = "a" rest4 "a" | "b" rest4 "b" | "c" rest4 "c" 
        rest4 = "a" len2 "a" | "b" len2 "b" | "c" len2 "c"
  
        char = "a" | "b" | "c"
    `,

    pythonStringLiterals: String.raw`
        Start = StringLiteral

        StringLiteral = 
        | FString
        | TripleQuotedString
        | SingleQuotedString
        | DoubleQuotedString

        SingleQuotedString = "'" SingleQuotedChar* "'"
        DoubleQuotedString = "\"" DoubleQuotedChar* "\""
  
        TripleQuotedString = TripleSingleQuoted | TripleDoubleQuoted
        TripleSingleQuoted = "'''" (~"'''" (EscapeSeq | any))* "'''"
        TripleDoubleQuoted = "\"\"\"" (~"\"\"\"" (EscapeSeq | any))* "\"\"\""
  
        FString = "f" (SingleQuotedString | DoubleQuotedString | TripleQuotedString)
  
        SingleQuotedChar = 
        | EscapeSeq
        | ~"'" any
    
        DoubleQuotedChar = 
        | EscapeSeq
        | ~"\"" any
    
        EscapeSeq = "\\" any
    `}

function matches(name, string) {
    const grammar = `G {${grammars[name]}}`
    return ohm.grammar(grammar).match(string).succeeded()
}

const testFixture = {
    canadianPostalCode: {
        good: ["A7X 2P8", "P8E 4R2", "K1V 9P2", "Y3J 5C0"],
        bad: [
            "A7X   9B2",
            "C7E 9U2",
            "",
            "Dog",
            "K1V\t9P2",
            " A7X 2P8",
            "A7X 2P8 ",
        ],
    },
    visa: {
        good: ["4128976567772613", "4089655522138888", "4098562516243"],
        bad: [
            "43333",
            "42346238746283746823",
            "7687777777263211",
            "foo",
            "π",
            "4128976567772613 ",
        ],
    },
    masterCard: {
        good: [
            "5100000000000000",
            "5294837679998888",
            "5309888182838282",
            "5599999999999999",
            "2221000000000000",
            "2720999999999999",
            "2578930481258783",
            "2230000000000000",
        ],
        bad: [
            "5763777373890002",
            "513988843211541",
            "51398884321108541",
            "",
            "OH",
            "5432333xxxxxxxxx",
        ],
    },
    notThreeEndingInOO: {
        good: ["", "fog", "Tho", "one", "a", "ab", "food"],
        bad: ["fOo", "gOO", "HoO", "zoo", "MOO", "123", "A15"],
    },
    divisibleBy16: {
        good: [
            "0",
            "00",
            "000",
            "00000",
            "00000",
            "000000",
            "00000000",
            "1101000000",
        ],
        bad: ["1", "00000000100", "1000000001", "dog0000000"],
    },
    eightThroughThirtyTwo: {
        good: Array(25)
            .fill(0)
            .map((x, i) => i + 8),
        bad: ["1", "0", "00003", "dog", "", "361", "90", "7", "-11"],
    },
    notPythonPycharmPyc: {
        good: [
            "",
            "pythons",
            "pycs",
            "PYC",
            "apycharm",
            "zpyc",
            "dog",
            "pythonpyc",
        ],
        bad: ["python", "pycharm", "pyc"],
    },
    restrictedFloats: {
        good: ["1e0", "235e9", "1.0e1", "1.0e+122", "55e20"],
        bad: ["3.5E9999", "2.355e-9991", "1e2210"],
    },
    palindromes2358: {
        good: [
            "aa",
            "bb",
            "cc",
            "aaa",
            "aba",
            "aca",
            "bab",
            "bbb",
            "ababa",
            "abcba",
            "aaaaaaaa",
            "abaaaaba",
            "cbcbbcbc",
            "caaaaaac",
        ],
        bad: ["", "a", "ab", "abc", "abbbb", "cbcbcbcb"],
    },
    pythonStringLiterals: {
        good: String.raw`''
      ""
      'hello'
      "world"
      'a\'b'
      "a\"b"
      '\n'
      "a\tb"
      f'\u'
      """abc"""
      '''a''"''"'''
      """abc\xdef"""
      '''abc\$def'''
      '''abc\''''`
            .split("\n")
            .map((s) => s.trim()),
        bad: String.raw`
      'hello"
      "world'
      'a'b'
      "a"b"
      'a''
      "x""
      """"""""
      frr"abc"
      'a\'
      '''abc''''
      """`
            .split("\n")
            .map((s) => s.trim()),
    },
}

for (let name of Object.keys(testFixture)) {
    describe(`when matching ${name}`, () => {
        for (let s of testFixture[name].good) {
            it(`accepts ${s}`, () => {
                assert.ok(matches(name, s))
            })
        }
        for (let s of testFixture[name].bad) {
            it(`rejects ${s}`, () => {
                assert.ok(!matches(name, s))
            })
        }
    })
}