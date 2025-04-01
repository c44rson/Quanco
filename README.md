<img src="https://github.com/c44rson/Quanco/blob/main/docs/QuancoLogo.png" alt="Quanco Logo" width="400" height="400">

# Quanco
A language for the intersection of Rugby fans, and those who love general-purpose scripting languages, like Python and TypeScript.

## Our Story
One evening after a challenging and rather cumbersome Loyola Rugby practice in Spring 2023, the heroes of our story, Carson Cabrera and Julian Mazzier hurried to the Keck Lab at LMU to grind their Data Structures and Applications homework. Unfortunately for our protagonists, although they loved programming in Java (mostly Julian), their accumulated brain damage from Coach Ray Thompson's unreasonable tackling drills and their many bouts with Long Beach State's "B side" made it near impossible for them to comprehend having to use parentheses and curly brackets, slowing them down immensely. During this time of extreme peril, a genius idea came to them. Why would anyone want to use Java for anything? Unable to remember the syntax of Python or TypeScript, they made a language that spoke to them.

## Notable Features
* Block statements use curly braces.
* Language is statically typed.
* Class and Function arguments can be listed in order or by a given argument name.
* No semicolons :).
* function = ruck
* struct = pitch
* return = pass

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
