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
2. Loops<b>
2a. Break can only be used in a loop<b>
2b. An infinite for loop cannot be declared<b>
2c. A non-executable for loop cannot be declared<b>
2d. Entities in loop definition must match<b>
2e. Must use conditional operator in for loop termination statement<b>
2f. Must use step operator in for loop step statement
3. Identifiers<b>
3a. New identifiers must not already be defined (based on block unless global)<b>
3b. Old identifiers must be defined
4. Functions<b>
4a. Can only use return within a function<b>
4b. Function call arguments and function parameters must match<b>
4bi. Function call arguments and function parameters must have the same types<b>
4bii. Function call arguments and function parameters must be of the same quantity<b>
4c. Checks for void functions that somehow return a value<b>
4d. Checks for non-void functions that somehow do not return a value<b>
4e. Function returns themselves must be compatible with function declaration
5. Classes<b>
5a. Constructor calls must be from a base that is a class<b>
5b. Constructor call arguments and Constructor parameters must match<b>
5bi. Constructor call arguments and Constructor parameters must have the same types<b>
5bii. Constructor call arguments and Constructor parameters must be of the same quantity
6. Variables<b>
6a. Assignments outside of declaration can only happen to mutable variables.<b>
6b. Union types are accepted.<b>

## Example Programs
### Defining and Calling a Function
Quanco:
```
ruck greet(name: str) -> str {
    pass "Try hard, " + name + "! Keep rucking!"
}

result: str = greet("Julian")
print(result)
result: str = greet(name="Carson")
print(result)
```
JavaScript:
```
function greet(name) {
    return `Try hard, ${name}! Keep rucking!`;
}
function main() {
    let result = greet("Julian");
    console.log(result);
    result = greet("Carson");
    console.log(result);
}

main();
```
### Nested Loops
Quanco:
```
ruck scrum() -> void {
    phase: int
    tackle: int
    for phase in range(1, 4) {
        for tackle in range(1, 4) {
            print("Phase " + phase + ", Tackle " + tackle + " : Drive forward!")
        }
    }
}

scrum()
```
JavaScript:
```
function scrum() {
    for (let phase = 1; phase <= 3; phase++) {
        for (let tackle = 1; tackle <= 3; tackle++) {
            console.log(`Phase ${phase}, Tackle ${tackle}: Drive forward!`);
        }
    }
}

scrum();
```
### Recursion
Quanco:
```
ruck lineout(depth: int) -> int {
    if depth == 0 {
        pass 1
    }
    else {
        pass depth * lineout(depth - 1)
    }
}

result: int = lineout(5)
print(result)
```
JavaScript:
```
function lineout(depth) {
    if (depth === 0) {
        return 1;
    } else {
        return depth * lineout(depth - 1);
    }
}

function main() {
    const result = lineout(5);
    console.log(result);  // Output: 120
}

main();
```
### Lists and Dictionaries
Quanco:
```
ruck maul() -> void {
    players: list[str] = ["Julian", "Carson", "Ray"]
    positions: dict[str, str] = {"Julian": "Flanker", "Carson": "Scrumhalf", "Ray": "Coach"}
    player: str

    for player in players {
        position: str = positions.get(player, "sin bin")
        print(player + " is in the " + position + " position")
    }
}

maul()
```
JavaScript:
```
function maul() {
    const players = ["Julian", "Carson", "Ray"];
    const positions = { Julian: "Flyhalf", Carson: "Scrumhalf", Ray: "Coach" };

    for (const player of players) {
        const position = positions[player] || "sin bin";
        console.log(`${player} is in the ${position} position`);
    }
}

maul();
```
### Structs and Classes
Quanco:
```
pitch RugbyPlayer {
    ruck __init__(self, name: str, position: str, tries: int = 0) {
        this.name: str = name
        this.position: str = position
        this.tries: int = tries
    }

    ruck scoreTry(self) -> void {
        this.tries = 1
        print(this.name + "scored a try! Total tries: " + this.tries)
    }
}

optionalPlayer: RugbyPlayer | None = None
player1: RugbyPlayer = RugbyPlayer("Julian", "Flanker")
player1.scoreTry()

optionalPlayer = RugbyPlayer("Carson", "Scrumhalf")
optionalPlayer.scoreTry()
```
JavaScript:
```
class RugbyPlayer {
    constructor(name, position, tries = 0) {
        this.name = name;
        this.position = position;
        this.tries = tries;
    }

    scoreTry() {
        this.tries += 1;
        console.log(`${this.name} scored a try! Total tries: ${this.tries}`);
    }
}

function main() {
    let optionalPlayer = null;
    const player1 = new RugbyPlayer("Julian", "Flyhalf");
    player1.scoreTry();

    optionalPlayer = new RugbyPlayer("Carson", "Scrumhalf");
    optionalPlayer.scoreTry();
}

main();
```

