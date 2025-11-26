const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

// Object to handle the grid and drawing
class Arena {
  constructor(tileSize, gridSize) {
    this.tileSize = tileSize;
    this.gridSize = gridSize;
    this.grid = [];
  }

  // Fills the grid with tiles
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

  // Update the canvas size to fit the current grid
  updateCanvasSize() {
    canvas.width = this.gridSize * this.tileSize;
    canvas.height = this.gridSize * this.tileSize;
  }

  // Check if a pos is on the border of the grid
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

  // Draw the whole game or an array of tiles to update
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

  // Get moves next to a given position if they are inside the grid
  getLegalMoves(x, y, returnCollision = true) {
    let possibleMoves = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    let currentMove = 0;
    let legalMoves = [];
    let isCollision = false;

    for (currentMove; currentMove < possibleMoves.length; currentMove++) {
      if (
        this.isValidMove(
          possibleMoves[currentMove][0],
          possibleMoves[currentMove][1]
        )
      ) {
        isCollision = this.checkCollision(
          possibleMoves[currentMove][0],
          possibleMoves[currentMove][1],
          true
        );
        if (returnCollision || (!isCollision && !returnCollision)) {
          legalMoves.push({
            xMove: possibleMoves[currentMove][0],
            yMove: possibleMoves[currentMove][1],
            collision: isCollision,
          });
        }
      }
    }

    return legalMoves;
  }

  // Get a line from a pos and a dir, returning the max tile and line length
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
      lineSize: lineSize,
    };
  }

  // Takes two pos and returns a direction that can be used as a set of [x, y] modifiers
  getMoveDirection(x, y, xMove, yMove) {
    return [Math.sign(xMove - x), Math.sign(yMove - y)];
  }

  // Get how many tiles are available after a movement
  getAvailableTilesNumber(x, y) {
    let totalMoves = [];
    let newMoves = this.getLegalMoves(x, y, false);
    let isNewMove = true;
    let foundMoves = [];
    let currentMove = 0;
    let currentTotalMove = 0;

    while (newMoves.length > 0) {
      foundMoves = this.getLegalMoves(
        newMoves[0].xMove,
        newMoves[0].yMove,
        false
      );
      newMoves.splice(0, 1);

      // Check if found moves are new
      for (currentMove = 0; currentMove < foundMoves.length; currentMove++) {
        isNewMove = true;
        for (
          currentTotalMove = 0;
          currentTotalMove < totalMoves.length;
          currentTotalMove++
        ) {
          if (
            foundMoves[currentMove].xMove ==
              totalMoves[currentTotalMove].xMove &&
            foundMoves[currentMove].yMove == totalMoves[currentTotalMove].yMove
          ) {
            isNewMove = false;
            break;
          }
        }
        if (isNewMove) {
          totalMoves.push(foundMoves[currentMove]);
          newMoves.push(foundMoves[currentMove]);
        }
      }
    }

    return totalMoves.length;
  }

  // Check if a set of coordinate is valid to play (a collision is valid, but being out of the grid isnt for example)
  isValidMove(x, y) {
    if (
      x * this.gridSize + y >= this.gridSize * this.gridSize ||
      x * this.gridSize + y < 0
    ) {
      return false;
    }
    return true;
  }

  // Check if the current tile will result in a collision with a wall or a player
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

  // Get the distance from a tile to another
  distanceTo(x, y, xTarget, yTarget) {
    let distanceTo = x + y - (xTarget + yTarget);

    return Math.abs(distanceTo);
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

  // Initial placement for the cycles, used at the start of a game
  placeBike(x, y, arena) {
    arena.grid[this.x * arena.gridSize + this.y].content = "Player";
    arena.grid[this.x * arena.gridSize + this.y].linkedPlayer = this;
    arena.grid[this.x * arena.gridSize + this.y].color = this.wallColor;
  }

  // Only approved way to move your cycle during a turn
  moveBike(x, y, arena, game) {
    if (!arena.isValidMove(x, y)) {
      game.endGame(true);
      // arena.drawArena([
      //   arena.grid[this.x * arena.gridSize + this.y],
      //   arena.grid[x * arena.gridSize + y],
      // ]);
      return;
    }

    if (arena.distanceTo(this.x, this.y, x, y) > 1) {
      console.log("Invalid move, tried to move to a too far away tile");
      game.endGame(true);
      // arena.drawArena([
      //   arena.grid[this.x * arena.gridSize + this.y],
      //   arena.grid[x * arena.gridSize + y],
      // ]);
      return;
    }

    let isCollision = arena.checkCollision(x, y);

    // Stop the game if a collision is detected
    if (isCollision) {
      game.endGame();
      arena.drawArena([
        arena.grid[this.x * arena.gridSize + this.y],
        arena.grid[x * arena.gridSize + y],
      ]);
      return;
    }

    arena.grid[this.x * arena.gridSize + this.y].content = "Wall";
    arena.grid[x * arena.gridSize + y].content = "Player";
    arena.grid[x * arena.gridSize + y].linkedPlayer = this;
    arena.grid[x * arena.gridSize + y].color = this.wallColor;
    // arena.drawArena([
    //   arena.grid[this.x * arena.gridSize + this.y],
    //   arena.grid[x * arena.gridSize + y],
    // ]);

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
    this.winner = "";
  }

  // Switch the player currently playing
  changePlayer() {
    if (this.currentPlayer == this.player1) {
      this.currentPlayer = this.player2;
    } else {
      this.currentPlayer = this.player1;
    }
    this.turn++;
  }

  // Get the player who isn't playing
  getOtherPlayer() {
    if (this.currentPlayer == this.player1) {
      return this.player2;
    } else {
      return this.player1;
    }
  }

  // End the game and show scores
  endGame(isCrash = false, currentArena) {
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
    this.winner = winner;
  }
}

class Bot {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike;
  }

  // Put your code here
  // This should only return an array containing the choosen coordinates
  // Ex: [2, 1]
  getMove(arena) {
    let moves = arena.getLegalMoves(
      this.linkedBike.x,
      this.linkedBike.y,
      false
    );

    if (moves.length == 0) {
      moves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y, true);
    }

    let randomMove = moves[Math.floor(Math.random(moves.length))];
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

bot1 = new Bot("Blue", player1);
bot2 = new Bot("Red", player2);

let gameCount = 0;
let currentGame = new Game(bot1, bot2, bot1);
currentArena.drawArena();

function playGameSet(gamesToPlay) {
  if (gameCount >= gamesToPlay) return;

  if (currentGame.isOver) {
    currentGame.winner.win++;
    gameCount++;

    // Game Initialisation
    currentArena = new Arena(30, 20);
    currentArena.fillGrid(true);
    console.log(currentArena.grid);

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

    bot1.linkedBike = player1;
    bot2.linkedBike = player2;

    // Game Loop
    currentGame = new Game(bot1, bot2, bot1);
    currentArena.drawArena();
  } else {
    let moveCoordinates = [];
    moveCoordinates = currentGame.currentPlayer.getMove(
      currentArena,
      currentGame
    );

    currentGame.currentPlayer.linkedBike.moveBike(
      moveCoordinates[0],
      moveCoordinates[1],
      currentArena,
      currentGame
    );
  }

  window.requestAnimationFrame(playGameSet);
}

playGameSet(200, bot1, bot2);
