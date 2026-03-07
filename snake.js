/*
  Classic Snake Game (vanilla JavaScript)

  How to use:
  1) Create an HTML file with a <canvas id="game" width="400" height="400"></canvas>
  2) Add optional HUD elements:
       <div id="score"></div>
       <div id="status"></div>
  3) Include this file with <script src="snake.js"></script>

  Controls:
  - Arrow keys or WASD to move
  - R to restart after game over (or anytime)
*/

(() => {
  "use strict";

  // ------- DOM lookups -------
  // The game draws on a canvas with id="game".
  const canvas = document.getElementById("game");

  if (!canvas) {
    // Fail fast with a helpful message if setup is incomplete.
    throw new Error('Snake setup error: missing <canvas id="game"> in your HTML.');
  }

  const ctx = canvas.getContext("2d");

  // Optional elements for displaying score and status text.
  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");

  // ------- Game configuration -------
  const TILE_SIZE = 20; // Each grid cell is 20x20 pixels.
  const GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
  const GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

  // Initial speed in milliseconds per tick.
  // Lower value = faster snake.
  const START_TICK_MS = 120;
  const MIN_TICK_MS = 70;
  const SPEED_UP_PER_FOOD = 2;

  // Colors (kept together so they are easy to tweak).
  const COLORS = {
    background: "#111111",
    gridLine: "rgba(255, 255, 255, 0.06)",
    food: "#ff4d4d",
    snakeHead: "#7cff9f",
    snakeBody: "#40d66f",
    overlay: "rgba(0, 0, 0, 0.45)",
    text: "#ffffff"
  };

  // ------- Mutable game state -------
  let snake = [];
  let direction = { x: 1, y: 0 }; // Current movement direction.
  let queuedDirection = { x: 1, y: 0 }; // Next direction from keyboard input.
  let food = { x: 0, y: 0 };
  let score = 0;
  let running = false;
  let gameOver = false;
  let tickMs = START_TICK_MS;
  let timerId = null;

  // Initialize (or reset) the game state.
  function initGame() {
    // Snake starts as 3 segments moving right.
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    queuedDirection = { x: 1, y: 0 };
    score = 0;
    running = false;
    gameOver = false;
    tickMs = START_TICK_MS;

    placeFood();
    updateHud();
    draw();
  }

  // Pick a random empty tile for food.
  function placeFood() {
    let isOnSnake = true;

    while (isOnSnake) {
      food = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };

      isOnSnake = snake.some((segment) => segment.x === food.x && segment.y === food.y);
    }
  }

  // Update optional text UI if those elements exist.
  function updateHud() {
    if (scoreEl) {
      scoreEl.textContent = `Score: ${score}`;
    }

    if (statusEl) {
      if (gameOver) {
        statusEl.textContent = "Game Over - Press R to restart";
      } else if (!running) {
        statusEl.textContent = "Press Arrow keys or WASD to start";
      } else {
        statusEl.textContent = "Running";
      }
    }
  }

  // Request a new direction while preventing instant 180-degree turns.
  function setDirection(nextX, nextY) {
    // Example: if moving right (1,0), moving left (-1,0) immediately is invalid.
    const isReverse = nextX === -direction.x && nextY === -direction.y;
    if (isReverse) return;

    queuedDirection = { x: nextX, y: nextY };

    // Start the loop on first valid input.
    if (!running && !gameOver) {
      running = true;
      runLoop();
    }

    updateHud();
  }

  // Main timed loop: update game state then redraw.
  function runLoop() {
    if (!running || gameOver) return;

    step();
    draw();

    // setTimeout makes speed adjustments simple (we can change tickMs each food).
    timerId = setTimeout(runLoop, tickMs);
  }

  // Advance the game by one tick.
  function step() {
    direction = queuedDirection;

    // New head is old head moved by current direction.
    const nextHead = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    // Classic snake: touching walls ends the game.
    const hitWall =
      nextHead.x < 0 ||
      nextHead.x >= GRID_WIDTH ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_HEIGHT;

    if (hitWall) {
      endGame();
      return;
    }

    // Collision with any existing segment means game over.
    const hitSelf = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
    if (hitSelf) {
      endGame();
      return;
    }

    // Add new head to the front.
    snake.unshift(nextHead);

    const ateFood = nextHead.x === food.x && nextHead.y === food.y;

    if (ateFood) {
      score += 1;
      // Slight speed increase over time to raise difficulty.
      tickMs = Math.max(MIN_TICK_MS, tickMs - SPEED_UP_PER_FOOD);
      placeFood();
    } else {
      // If no food eaten, remove tail so total length stays the same.
      snake.pop();
    }

    updateHud();
  }

  function endGame() {
    gameOver = true;
    running = false;
    clearTimeout(timerId);
    updateHud();
  }

  // Draw subtle grid lines for readability.
  function drawGrid() {
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;

    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      const px = x * TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      const py = y * TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }
  }

  function draw() {
    // Clear and paint background each frame.
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    // Draw food.
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Draw snake (head with a brighter color).
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    if (gameOver) {
      ctx.fillStyle = COLORS.overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = COLORS.text;
      ctx.textAlign = "center";
      ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 8);
      ctx.font = '16px "Trebuchet MS", sans-serif';
      ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  // Keyboard controls.
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "arrowup" || key === "w") setDirection(0, -1);
    else if (key === "arrowdown" || key === "s") setDirection(0, 1);
    else if (key === "arrowleft" || key === "a") setDirection(-1, 0);
    else if (key === "arrowright" || key === "d") setDirection(1, 0);
    else if (key === "r") {
      clearTimeout(timerId);
      initGame();
    }
  });

  initGame();
})();
