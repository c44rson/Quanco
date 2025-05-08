<img src="https://github.com/c44rson/Quanco/blob/main/docs/QuancoLogo.png" alt="Quanco Logo" width="400" height="400">

# Quanco
A language for people who want a more robust, albeit annoying JS.
https://c44rson.github.io/Quanco

## Our Story
One evening after a challenging and rather cumbersome Loyola Rugby practice in Spring 2023, the heroes of our story, Carson Cabrera and Julian Mazzier hurried to the Keck Lab at LMU to grind their Data Structures and Applications homework. Unfortunately for our protagonists, although they loved programming in Java (mostly Julian), their accumulated brain damage from Coach Ray Thompson's unreasonable tackling drills and their many bouts with Long Beach State's "B side" made it near impossible for them to comprehend having to use semicolons, slowing them down immensely. During this time of extreme peril, a genius idea came to them. What if we made a language that didn't have semicolons?

## Notable Features
* No semicolons :).
* Block statements use curly braces.
* Language is statically typed.
* Class and Function arguments must be listed in order and with all parameters.
* For-loops that never run or are infinite are disallowed

### Semantic Checks
1. Type equivalence everywhere
2. Loops<br>
2a. Break can only be used in a loop<br>
2b. An infinite for loop cannot be declared<br>
2c. A non-executable for loop cannot be declared<br>
2d. Entities in loop definition must match<br>
2e. Must use conditional operator in for loop termination statement<br>
2f. Must use step operator in for loop step statement
3. Identifiers<br>
3a. New identifiers must not already be defined (based on block unless global)<br>
3b. Old identifiers must be defined
4. Functions<br>
4a. Can only use return within a function<br>
4b. Function call arguments and function parameters must match<br>
4bi. Function call arguments and function parameters must have the same types<br>
4bii. Function call arguments and function parameters must be of the same quantity<br>
4c. Checks for void functions that somehow return a value<br>
4d. Checks for non-void functions that somehow do not return a value<br>
4e. Function returns themselves must be compatible with function declaration
5. Classes<br>
5a. Constructor calls must be from a base that is a class<br>
5b. Constructor call arguments and Constructor parameters must match<br>
5bi. Constructor call arguments and Constructor parameters must have the same types<br>
5bii. Constructor call arguments and Constructor parameters must be of the same quantity
6. Variables<br>
6a. Assignments outside of declaration can only happen to mutable variables.<br>
6b. Union types are accepted.<br>

## Example Programs
### Defining and Calling a Function
Quanco:
```
def greet(name: str) -> str {
    return "Try hard, " + name + "! Keep rucking!"
}

def x() -> void {
    return
}

result: str = greet("Julian")
print(result)
result = greet("Carson")
print(result)

x()
```
JavaScript:
```
function greet_1(name_2) {
  return (("Try hard, " + name_2) + "! Keep rucking!");
}
function x_3() {
  return;
}
let result_4 = greet_1("Julian");
console.log(result_4);
result_4 = greet_1("Carson");
console.log(result_4);
x_3()

```
### Nested Loops
Quanco:
```
def scrum() -> void {
    phase: num = 0
    tackle: num = 0
    for x: num = phase, x < 4, ++x {
        for y: num = tackle, y < 4, ++y {
            print("Phase " + phase + ", Tackle " + tackle + " : Drive forward!")
        }
    }
}

scrum()
```
JavaScript:
```
function scrum_1() {
  let phase_2 = 0;
  let tackle_3 = 0;
  for (let x_4 = phase_2; x_4 < 4; ++x_4) {
    for (let y_5 = tackle_3; y_5 < 4; ++y_5) {
      console.log((((("Phase " + phase_2) + ", Tackle ") + tackle_3) + " : Drive forward!"));
    }
  }
}

scrum_1()

```
### Recursion
Quanco:
```
def lineout(depth: num) -> num {
    if (depth == 0) {
        return 1
    }
    else {
        return depth * lineout(depth - 1)
    }
}

result: num = lineout(5)
print(result)
```
JavaScript:
```
function lineout_1(depth_2) {
  if (depth_2 == 0) {
    return 1;
  } else {
    return (depth_2 * lineout_1((depth_2 - 1)));
  }
}
let result_3 = lineout_1(5);
console.log(result_3);
```
### For more examples... see our examples folder!
