import { Ship, BattleShips, Field } from "../modules/classes.js";

const playerBoard = document.querySelector(".playerBoard");
const shipsBoard = document.querySelector(".shipsBoard");
const start = document.getElementById("start");
const recap = document.querySelector(".recap");
const randomBtn = document.getElementById("randomizer");
const fireBtn = document.getElementById("fire");
const infos = document.getElementById("computerInfos");
const compHits = document.getElementById("compHits");
const compMiss = document.getElementById("compMiss");
const compShips = document.getElementById("compShips");
const playHits = document.getElementById("playHits");
const playMiss = document.getElementById("playMiss");
const playShips = document.getElementById("playShips");
const rulesBtn = document.getElementById('rules');
const rulesPage = document.querySelector('.rules')
const mainBlur = document.getElementById('main')

fireBtn.disabled = true;

const computerField = new Field();
const playerField = new Field();
const computerShips = new BattleShips();
const playerShips = new BattleShips();

rulesBtn.onclick = () => {
  rulesPage.classList.toggle('display')
}

let gameState = {
  turn: 1,
  playerHits: 0,
  computerHits: 0,
  playerMiss: 0,
  computerMiss: 0,
};
stroboscopic()

function gameInitialisation() {
  gameState = {
    turn: 1,
    playerHits: 0,
    computerHits: 0,
    playerMiss: 0,
    computerMiss: 0,
  };
  
  gameSetup();
  generateInventory();
  randomlyPlaceShips(playerShips, playerField);
  paintShips();
  //console.log(computerField.field);
  start.onclick = () => {
    randomBtn.onclick = () => {};
    mainGame();
  };
}

function stroboscopic(){
  let map = playerField.createField(true);
  map.forEach((cell) => {
    playerBoard.appendChild(cell);
  });
  computerField.createField(false);
  generateInventory()

  const divs = document.querySelectorAll('.empty, .water')

  let intervalId = setInterval(() => {
    divs.forEach(div => {
      div.style.backgroundColor = randomBackgroundColor()
    })
  },200)
  divs.forEach(div => {
    div.style.backgroundColor = randomBackgroundColor()

  })

  start.onclick = () => {
    clearInterval(intervalId)
    mainBlur.classList.toggle('blur')
    start.style.visibility = 'hidden'
    rulesBtn.style.visibility = 'hidden'
    playerBoard.innerHTML = '';
    shipsBoard.innerHTML = '';
    gameInitialisation();
  }
}

function randomBackgroundColor() {
  const r = Math.floor(Math.random() * 255)
  const g = Math.floor(Math.random() * 255)
  const b = Math.floor(Math.random() * 255)
  return `rgb(${r}, ${g}, ${b})`
}

function gameSetup() {
  let map = playerField.createField(true);
  map.forEach((cell) => {
    playerBoard.appendChild(cell);
  });
  computerField.createField(false);
  computerField.randomMoves();

  generateShips(playerShips);
  generateShips(computerShips);

  randomlyPlaceShips(computerShips, computerField);

  randomBtn.onclick = () => {
    playerField.createField();
    shipsBoard.querySelectorAll(".ship").forEach((ship) => {
      ship.className = "";
      ship.classList.add("empty");
    });
    randomlyPlaceShips(playerShips, playerField);
    paintShips();
  };
}

function generateInventory() {
  //Create the ship board layout
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const div = document.createElement("div");
      div.setAttribute("x", i);
      div.setAttribute("y", j);
      div.classList.add("empty");
      div.classList.add("cell");
      shipsBoard.append(div);
    }
  }
}

function generateShips(str) {
  str.addShip(new Ship("Carrier", 5));
  str.addShip(new Ship("Battleship", 4));
  str.addShip(new Ship("Destroyer", 3));
  str.addShip(new Ship("Submarine", 3));
  str.addShip(new Ship("PatrolBoat", 2));
}

function mainGame() {
  const turn = gameState.turn % 2 === 0 ? "computer" : "player";
  console.log(turn);
  infos.innerHTML += `<br><p>Turn ${gameState.turn}:</p><h3>It's ${turn}'s turn!</h3><br>`;
  if (turn === "player") {
    pickShots();
    waitForX(playerShips.army.length, turn, computerField.field);
  } else {
    let shots = null;
    let num = null;
    if (computerField.hits.length === 0) {
      shots = computerField.randomShot(computerShips.army.length);
      fire(turn, playerField.field, shots);
    } else {
      [shots, num] = search();
      if (shots.length === computerShips.army.length) {
        fire(turn, playerField.field, shots);
      } else {
        shots = shots.concat(
          computerField.randomShot(computerShips.army.length - num)
        );
        fire(turn, playerField.field, shots);
      }
    }
  }
}

function search() {
  const hit = computerField.hits[0];
  let counter = 0;
  const shots = [];
  computerField.hits.forEach((hit) => {
    const x = hit.x;
    const y = hit.y;
    const xValues = [-1, 0, 0, 1];
    const yValues = [0, -1, 1, 0];

    for (let values = 0; values < 4; values++) {
      let i = x + xValues[values];
      let j = y + yValues[values];
      if (i < 0 || i > 9 || j < 0 || j > 9) continue;
      const cell = shipsBoard.querySelector(`[x="${i}"][y="${j}"]`);

      if (
        !cell.classList.contains("hit") &&
        !cell.classList.contains("miss") &&
        !cell.classList.contains("target")
      ) {
        counter += 1;
        cell.classList.add("target");
        shots.push({ x: i, y: j });
      }
    }
  });
  for (let i = shots.length - 1; i >= 0; i--) {
    let index = Math.floor(Math.random() * i);
    if (shots[i] === shots[index]) continue;
    let tmp = shots[i];
    shots[i] = shots[index];
    shots[index] = tmp;
  }
  while (shots.length > 5) {
    shots.pop();
  }
  /* let tmp = hit
    computerField.hits[0] = computerField.hits[computerField.hits.length - 1]
    computerField.hits[computerField.hits.length - 1] = tmp */
  return [shots, counter];
}

function pickShots() {
  infos.innerHTML += `<p>Set up to ${playerShips.army.length} shots!</p>`;
  playerBoard.querySelectorAll(".water").forEach((cell) => {
    cell.onclick = () => {
      if (!cell.classList.contains("locked")) {
        if (!cell.classList.contains("shooting")) {
          cell.classList.remove("water");
          cell.classList.add("shooting");
        }
      } else if (cell.classList.contains("shooting")) {
        cell.classList.remove("shooting");
        cell.classList.add("water");
      }
    };
  });
}

function waitForX(remainingShips, turn, field) {
  let intervalId = setInterval(() => {
    const cells = playerBoard.querySelectorAll(".shooting");
    //console.log(`remaining ships: ${remainingShips}, shots: ${cells.length}`)
    if (cells.length === remainingShips) {
      playerBoard.querySelectorAll(".water").forEach((cell) => {
        cell.classList.add("locked");
      });
      playerBoard.querySelectorAll(".shooting").forEach((cell) => {
        cell.onclick = () => {
          cell.classList.toggle("shooting");
        };
      });
      fireBtn.disabled = false;
      fireBtn.onclick = () => {
        clearInterval(intervalId);
        fire(turn, field);
      };
    }
  }, 50);
}

function fire(turn, field, shots) {
  document
    .querySelectorAll(".target")
    .forEach((cell) => cell.classList.remove("target"));
  if (turn === "player") {
    fireBtn.disabled = true;
    playerBoard.querySelectorAll(".water.locked").forEach((cell) => {
      cell.classList.remove("locked");
    });
    playerBoard.querySelectorAll(".shooting").forEach((cell) => {
      cell.classList.remove("shooting");
      if (itsAShip(turn, cell, field, computerShips.army)) {
        cell.classList.add("hit", "locked");
      } else {
        cell.classList.add("miss", "locked");
      }
    });
  } else {
    shots.forEach((shot) => {
      const cell = shipsBoard.querySelector(`[x="${shot.x}"][y="${shot.y}"]`);
      if (itsAShip(turn, shot, field, playerShips.army)) {
        cell.classList.add("hit");
      } else {
        cell.classList.add("miss");
      }
    });
  }
  endTurn(turn);
}

function endTurn(turn) {
  gameState.playerHits = playerBoard.querySelectorAll(".hit").length;
  gameState.computerHits = shipsBoard.querySelectorAll(".hit").length;
  gameState.playerMiss = playerBoard.querySelectorAll(".miss").length;
  gameState.computerMiss = shipsBoard.querySelectorAll(".miss").length;
  turn === "player"
    ? sinkShip(turn, computerShips)
    : sinkShip(turn, playerShips);
  compHits.textContent = gameState.computerHits;
  compMiss.textContent = gameState.computerMiss;
  compShips.textContent = computerShips.army.length;
  playHits.textContent = gameState.playerHits;
  playMiss.textContent = gameState.playerMiss;
  playShips.textContent = playerShips.army.length;
  infos.scrollTop = infos.scrollHeight
  if (endgame()) {
    reset(turn);
  }
  gameState.turn += 1;
  mainGame();
}

function endgame() {
  return gameState.computerHits === 17 || gameState.playerHits === 17;
}

function reset(turn) {
  displayWin(turn);
  someBtn.onclick = initialisation();
}


function randomlyPlaceShips(army, field) {
  army["army"].forEach((ship) => {
    //Get a random direction: horizontal (0) vertical (1)
    const direction = Math.floor(Math.random() * 2);
    let x = null;
    let y = null;
    let counter = 0;
    //horizontal
    if (direction === 0) {
      do {
        //reset counter to 0
        counter = 0;
        //Get a x position that will make the boat fit
        x = Math.floor(Math.random() * (10 - ship.length));
        y = Math.floor(Math.random() * 10);
        for (let i = 0; i < ship.length; i++) {
          //field[][].ship is set to false as there is no ship.
          //If all cells are false (free), end the while loop.
          //Performance is quite bad as it's a while loop with random assignements.
          //Could end up in an infinite loop with a lot of bad luck.
          //To improve if time.
          if (!field.field[x + i][y].ship) {
            counter += 1;
          }
        }
      } while (counter !== ship.length);
      //Now that we know all the cells are free, assign them to true and get the name
      for (let i = 0; i < ship.length; i++) {
        field.field[x + i][y].ship = true;
        field.field[x + i][y].name = ship.name;
        ship.x = x;
        ship.xMax = x + ship.length;
        ship.y = y;
        ship.yMax = y;
      }
    } else {
      //same logic on y axis.
      do {
        counter = 0;
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * (10 - ship.length));
        for (let i = 0; i < ship.length; i++) {
          if (!field.field[x][y + i].ship) {
            counter += 1;
          }
        }
      } while (counter !== ship.length);
      for (let i = 0; i < ship.length; i++) {
        field.field[x][y + i].ship = true;
        field.field[x][y + i].name = ship.name;
        ship.x = x;
        ship.xMax = x;
        ship.y = y;
        ship.yMax = y + ship.length;
      }
    }
  });
}

function itsAShip(turn, cell, field, army) {
  let x = null;
  let y = null;
  //Assign x,y depending of who is playing.
  if (turn === "player") {
    x = cell.getAttribute("x");
    y = cell.getAttribute("y");
  } else {
    x = cell.x;
    y = cell.y;
  }
  //result to true if there is a ship (set in randomlyPlaceShips())
  if (field[x][y].ship) {
    const name = field[x][y].name;
    let ship = army.find((ship) => ship.name === name);
    if (ship.health !== undefined) {
      ship.health -= 1;
      infos.innerHTML += `<p>${turn} hit ${ship.name} on cell ${x} - ${y}<p/>`;
    }
    //Incrementing counters depending of who played
    if (turn === "player") {
      gameState.playerHits += 1;
    } else {
      gameState.computerHits += 1;
      //Add the hit to the knowledge
      computerField.hits.push({ x: x, y: y, name: ship.name });
    }
    return true;
  } else {
    turn === "player"
      ? (gameState.playerMiss += 1)
      : (gameState.computerMiss += 1);
    return false;
  }
}

function sinkShip(turn, army) {
  for (let i = army.army.length - 1; i >= 0; i--) {
    /* console.log(computerShips.army)
        console.log(computerShips.army[i]) */
    if (army.army[i].health === 0) {
      infos.innerHTML += `<h3 class="sank">${turn} sank ${army.army[i].name}</h3>`;
      if (turn === "computer") {
        //Filtering out the now sinked ship out of the knowledge
        computerField.hits = computerField.hits.filter(boat => boat.name !== army.army[i].name)
      }
      //Might come handy to remember sinked ships ?
      army.deadShips.push(army.army.splice(i, 1));
    }
  }
}

function paintShips() {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const cell = playerField.field[i][j];
      if (cell.ship) {
        const paintedShip = shipsBoard.querySelector(`[x="${i}"][y="${j}"]`);
        paintedShip.classList.replace("empty", "ship");
        paintedShip.classList.add(`${playerField.field[i][j].name}`);
      }
    }
  }
}
