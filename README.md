<img src="https://github.com/c44rson/Quanco/blob/main/docs/QuancoLogo.png" alt="Quanco Logo" width="400" height="400">

# Quanco
A language for the intersection of Rugby fans, and those who love Java programming, but hate its verbosity.

## Our Story
One evening after a challenging and rather cumbersome Loyola Rugby practice in Spring 2023, the heroes of our story, Carson Cabrera and Julian Mazzier hurried to the Keck Lab at LMU to grind their Data Structures and Applications homework. Unfortunately for our protagonists, although they loved programming in Java (mostly Julian), their accumulated brain damage from Coach Ray Thompson's unreasonable tackling drills and their many bouts with Long Beach State's "B side" made it near impossible for them to comprehend having to use parentheses and curly brackets, slowing them down immensely. During this time of extreme peril, a genius idea came to them. What if we make Java, without all the tedious things that make it impossible to have a positive programming experience without Adderall? And Rugby syntax, just cuz.

## Notable Features
* Strong typing is encouraged, but type inference is available for all variables.
* All "main" functions have their public, static, and void nature inferred.
* "for" and "while" loops use Pythonic pattern matching and range-style looping.
* All Loops and Classes do not have curly braces, and instead use :.
* Class and Function argument types adopt Python conventions (arg_name: arg_type).
* Class and Function arguments can be listed in order or by a given argument name.
* No need for ; on every line.
* Indentation is forced, think Python conventions.

## Example Programs
### Defining and Calling a Function
Quanco:
def greet(name: str) -> str:
    return "Try hard, " + name + "!"

print(greet("Julian"))
print(greet(name="Carson"))
JavaScript:
function greet(name) {
    return `Try hard, ${name}!`;
}

console.log(greet("Julian"));
console.log(greet("Carson"));
### Nested Loops
Quanco:
for i in range(1, 4):
    for j in range(1, 4):
        print(f"Rugby score: {i}-{j}")
JavaScript:
for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
        console.log(`Rugby score: ${i}-${j}`);
    }
}
### Recursion
Quanco:
def factorial(n: int) -> int:
    if n == 0:
        return 1
    else:
        return n * factorial(n - 1)

print(factorial(5))
JavaScript:
function factorial(n) {
    if (n === 0) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

console.log(factorial(5));
### Lists and Dictionaries
Quanco:
players = ["Julian", "Carson", "Ray"]
positions = {"Julian": "Flyhalf", "Carson": "Scrumhalf", "Ray": "Coach"}

for player in players:
    print(f"{player} plays {positions.get(player, 'no position')}")
JavaScript:
const players = ["Julian", "Carson", "Ray"];
const positions = { Julian: "Flyhalf", Carson: "Scrumhalf", Ray: "Coach" };

for (const player of players) {
    console.log(`${player} plays ${positions[player] || "no position"}`);
}
### Structs and Classes
Quanco:
class Player:
    def __init__(self, name: str, position: str, tries: int = 0):
        self.name = name
        self.position = position
        self.tries = tries
    def score_try(self):
        self.tries += 1
        print(f"{self.name} scored a try! Total tries: {self.tries}")

optional_player: Player? = None
player1 = Player("Julian", "Flyhalf")
player1.score_try()

optional_player = Player("Carson", "Scrumhalf")
optional_player.score_try()
JavaScript:
class Player {
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

let optionalPlayer = null;
const player1 = new Player("Julian", "Flyhalf");
player1.scoreTry();

optionalPlayer = new Player("Carson", "Scrumhalf");
optionalPlayer.scoreTry();
