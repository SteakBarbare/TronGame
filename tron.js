const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

class Arena {
  constructor(tileSize, gridSize) {
    this.tileSize = tileSize;
    this.gridSize = gridSize;
    this.grid = [];
  }

  fillGrid(updateCanvas, createBorderWalls = true) {
    let xPos, yPos;

    for (xPos = 0; xPos < this.gridSize; xPos++) {
      for (yPos = 0; yPos < this.gridSize; yPos++) {
        if (createBorderWalls && this.isBorder(xPos, yPos)) {
          this.grid.push(new Tile(xPos, yPos, "Wall", "rgb(0 0 0)"));
        } else {
          this.grid.push(new Tile(xPos, yPos, "Empty", "rgb(222 222 222)"));
        }
      }
    }

    if (updateCanvas) {
      this.updateCanvasSize();
    }
  }

  updateCanvasSize() {
    canvas.width = this.gridSize * this.tileSize;
    canvas.height = this.gridSize * this.tileSize;
  }

  isBorder(x, y) {
    if (
      x == 0 ||
      y == 0 ||
      x == this.gridSize - 1 ||
      y == this.gridSize - 1 ||
      (x == this.gridSize - 1 && y == this.gridSize - 1)
    ) {
      return true;
    }

    return false;
  }

  drawArena(tilesArray = this.grid) {
    let currentTile = 0;
    for (currentTile; currentTile < tilesArray.length; currentTile++) {
      switch (tilesArray[currentTile].content) {
        case "Wall":
          context.fillStyle = tilesArray[currentTile].color;

          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
          break;

        case "Empty":
          context.fillStyle = tilesArray[currentTile].color;

          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
          break;

        case "Player":
          context.fillStyle = tilesArray[currentTile].linkedPlayer.color;
          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
      }

      context.strokeStyle = "black";
      context.rect(
        tilesArray[currentTile].x * this.tileSize,
        tilesArray[currentTile].y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
      context.stroke();
    }
  }

  getLegalMoves(x, y) {
    let possibleMoves = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    let currentMove = 0;
    let legalMoves = [];

    for (currentMove; currentMove < possibleMoves.length; currentMove++) {
      if (
        this.isValidMove(
          possibleMoves[currentMove][0],
          possibleMoves[currentMove][1]
        )
      ) {
        legalMoves.push({
          xMove: possibleMoves[currentMove][0],
          yMove: possibleMoves[currentMove][1],
          collision: this.checkCollision(
            possibleMoves[currentMove][0],
            possibleMoves[currentMove][1],
            true
          )
        });
      }
    }

    return legalMoves;
  }

  getLineSize(x, y, dir) {
    let lineSize = 0;
    let currentX = x;
    let currentY = y;

    currentX += dir[0];
    currentY += dir[1];
    lineSize++;

    while (
      this.isValidMove(currentX, currentY) &&
      this.checkCollision(currentX, currentY) == false
    ) {
      currentX += dir[0];
      currentY += dir[1];
      lineSize++;
    }

    return {
      maxX: currentX,
      maxY: currentY,
      lineSize: lineSize
    };
  }

  getMoveDirection(x, y, xMove, yMove) {
    return [Math.sign(xMove - x), Math.sign(yMove - y)];
  }

  isValidMove(x, y) {
    if (
      x * this.gridSize + y >= this.gridSize * this.gridSize ||
      x * this.gridSize + y < 0
    ) {
      return false;
    }
    return true;
  }

  checkCollision(x, y, getCollisionType = false) {
    if (
      this.grid[x * this.gridSize + y].content == "Wall" ||
      this.grid[x * this.gridSize + y].content == "Player"
    ) {
      if (getCollisionType) {
        return this.grid[x * this.gridSize + y].content;
      }

      return true;
    }

    return false;
  }
}

class Tile {
  // Eligible content types are: Empty, Wall, Player
  // Colors format should be a string color code, ex: "rbg(xxx, xxx, xxx)"
  constructor(x, y, content, color) {
    this.x = x;
    this.y = y;
    this.content = content;
    this.color = color;
    this.linkedPlayer = undefined;
  }
}

class Bike {
  constructor(x, y, boost, maxBoost, color, wallColor) {
    this.x = x;
    this.y = y;
    this.boost = boost;
    this.maxBoost = maxBoost;
    this.color = color;
    this.wallColor = wallColor;
  }

  placeBike(x, y, arena) {
    arena.grid[this.x * arena.gridSize + this.y].content = "Player";
    arena.grid[this.x * arena.gridSize + this.y].linkedPlayer = this;
    arena.grid[this.x * arena.gridSize + this.y].color = this.wallColor;
  }

  moveBike(x, y, arena, game) {
    // console.log(x);
    // console.log(y);
    // console.log(arena.gridSize);
    // console.log(x * arena.gridSize + y);
    // console.log(arena.grid[x * arena.gridSize + y]);

    if (!arena.isValidMove(x, y)) {
      game.endGame(true);
      return;
    }

    let isCollision = arena.checkCollision(x, y);

    // Stop the game if a collision is detected
    if (isCollision) {
      game.endGame();
      return;
    }

    arena.grid[this.x * arena.gridSize + this.y].content = "Wall";
    arena.grid[x * arena.gridSize + y].content = "Player";
    arena.grid[x * arena.gridSize + y].linkedPlayer = this;
    arena.grid[x * arena.gridSize + y].color = this.wallColor;
    arena.drawArena([
      arena.grid[this.x * arena.gridSize + this.y],
      arena.grid[x * arena.gridSize + y]
    ]);

    this.x = x;
    this.y = y;

    game.changePlayer();
  }
}

class Game {
  constructor(player1, player2, currentPlayer) {
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = currentPlayer;
    this.winner = undefined;
    this.turn = 1;
    this.isOver = false;
  }

  changePlayer() {
    if (this.currentPlayer == this.player1) {
      this.currentPlayer = this.player2;
    } else {
      this.currentPlayer = this.player1;
    }
    this.turn++;
  }

  getOtherPlayer() {
    if (this.currentPlayer == this.player1) {
      return this.player2;
    } else {
      return this.player1;
    }
  }

  endGame(isCrash = false) {
    let winner = this.getOtherPlayer();
    console.log(winner.name + " has won !");
    console.log("It took " + this.turn + " turns to achieve victory");
    if (isCrash) {
      console.log(
        "Victory was obtained because" +
          currentPlayer.name +
          " crashed the game (ex: invalid move)"
      );
    }

    this.isOver = true;
  }
}

class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }

  getMove(arena) {
    let legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);
    let safeMoves = [];
    let bestMoves = [];
    let randomMove = [];
    let currentMove = 0;

    let moveDir = [];
    let line = 0;
    let biggestLine = -1;

    for (currentMove; currentMove < legalMoves.length; currentMove++) {
      if (legalMoves[currentMove].collision == false) {
        safeMoves.push(legalMoves[currentMove]);
      }
    }

    for (currentMove = 0; currentMove < safeMoves.length; currentMove++) {
      moveDir = arena.getMoveDirection(
        this.linkedBike.x,
        this.linkedBike.y,
        safeMoves[currentMove].xMove,
        safeMoves[currentMove].yMove
      );
      console.log(moveDir);
      line = arena.getLineSize(this.linkedBike.x, this.linkedBike.y, moveDir);
      console.log(line);

      if (line.lineSize > biggestLine) {
        biggestLine = line.lineSize;
        bestMoves = [safeMoves[currentMove]];
      } else if (line.lineSize == biggestLine) {
        bestMoves.push(safeMoves[currentMove]);
      }
    }
    // console.log(bestMoves);

    if (bestMoves.length == 0) {
      randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
      randomMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    // console.log([randomMove.xMove, randomMove.yMove]);

    return [randomMove.xMove, randomMove.yMove];
  }
}

// Game Initialisation
currentArena = new Arena(30, 20);
currentArena.fillGrid(true);

player1 = new Bike(1, 1, 3, 3, "rgb(15, 28, 125)", "rgb(29, 10, 82)");
player2 = new Bike(
  currentArena.gridSize - 2,
  currentArena.gridSize - 2,
  3,
  3,
  "rgb(161, 18, 32)",
  "rgb(110, 19, 44)"
);

player1.placeBike(player1.x, player1.y, currentArena);
player2.placeBike(player2.x, player2.y, currentArena);

bot1 = new Bot("SuuS", player1);
bot2 = new Bot("La Sauce", player2);

currentArena.drawArena();

// Game Loop
currentGame = new Game(bot1, bot2, bot1);

// Manual Controls
// document.addEventListener("keydown", event => {
//   if (event.repeat || currentGame.isOver) return;
//   switch (event.key) {
//     case "ArrowRight":
//       currentGame.currentPlayer.linkedBike.moveBike(
//         currentGame.currentPlayer.linkedBike.x + 1,
//         currentGame.currentPlayer.linkedBike.y,
//         currentArena,
//         currentGame
//       );
//       break;
//     case "ArrowLeft":
//       currentGame.currentPlayer.linkedBike.moveBike(
//         currentGame.currentPlayer.linkedBike.x - 1,
//         currentGame.currentPlayer.linkedBike.y,
//         currentArena,
//         currentGame
//       );
//       break;
//     case "ArrowDown":
//       currentGame.currentPlayer.linkedBike.moveBike(
//         currentGame.currentPlayer.linkedBike.x,
//         currentGame.currentPlayer.linkedBike.y + 1,
//         currentArena,
//         currentGame
//       );
//       break;
//     case "ArrowUp":
//       currentGame.currentPlayer.linkedBike.moveBike(
//         currentGame.currentPlayer.linkedBike.x,
//         currentGame.currentPlayer.linkedBike.y - 1,
//         currentArena,
//         currentGame
//       );
//       break;
//   }
// });

function gameLoop() {
  if (!currentGame.isOver) {
    let moveCoordinates = [];
    moveCoordinates = currentGame.currentPlayer.getMove(currentArena);

    currentGame.currentPlayer.linkedBike.moveBike(
      moveCoordinates[0],
      moveCoordinates[1],
      currentArena,
      currentGame
    );
  }
  window.requestAnimationFrame(gameLoop);
}

gameLoop();
