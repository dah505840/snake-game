(() => {
  const COLORS = {
    teal: "#00A19D",
    tealDark: "#008580",
    yellow: "#FFC700",
    yellowDark: "#E0AD00",
    droplet: "#5ED4FF",
    dropletHighlight: "#B8EEFF",
    grid: "rgba(255, 255, 255, 0.06)",
  };

  const GRID = 20;
  const TICK_MS = 110;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMessage = document.getElementById("overlay-message");
  const startBtn = document.getElementById("start-btn");

  const cols = canvas.width / GRID;
  const rows = canvas.height / GRID;

  const jerryCanImg = new Image();
  jerryCanImg.src = "assets/jerry-can-official.png";
  const dropletImg = new Image();
  dropletImg.src = "assets/droplet.svg";
  [jerryCanImg, dropletImg].forEach((img) => {
    img.onload = () => {
      if (!running) draw();
    };
  });

  let snake;
  let direction;
  let nextDirection;
  let food;
  let score;
  let highScore = Number(localStorage.getItem("cw-snake-high") || 0);
  let loopId;
  let running = false;
  let touchStart = null;

  highScoreEl.textContent = String(highScore);

  function resetGame() {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = "0";
    spawnFood();
  }

  function spawnFood() {
    let spot;
    do {
      spot = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (snake.some((s) => s.x === spot.x && s.y === spot.y));
    food = spot;
  }

  function showOverlay(title, message, buttonText) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    startBtn.textContent = buttonText;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    if (loopId) clearInterval(loopId);
    resetGame();
    running = true;
    hideOverlay();
    loopId = setInterval(tick, TICK_MS);
    draw();
  }

  function endGame() {
    running = false;
    clearInterval(loopId);
    loopId = null;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("cw-snake-high", String(highScore));
      highScoreEl.textContent = String(highScore);
    }
    showOverlay(
      "Great effort!",
      `You collected ${score} droplet${score === 1 ? "" : "s"}. Every drop brings hope.",
      "Play Again"
    );
  }

  function tick() {
    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (
      newHead.x < 0 ||
      newHead.y < 0 ||
      newHead.x >= cols ||
      newHead.y >= rows ||
      snake.some((s) => s.x === newHead.x && s.y === newHead.y)
    ) {
      endGame();
      return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawSnakeSegment(x, y, isHead) {
    const px = x * GRID;
    const py = y * GRID;
    const pad = 2;

    if (isHead) {
      drawJerryCan(px, py, GRID, direction);
      return;
    }

    const radius = 5;
    ctx.fillStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.roundRect(px + pad, py + pad, GRID - pad * 2, GRID - pad * 2, radius);
    ctx.fill();

    ctx.fillStyle = COLORS.yellowDark;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.roundRect(px + pad + 2, py + pad + 2, GRID - pad * 2 - 4, 4, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function directionAngle(dir) {
    if (dir.x === 1) return Math.PI;
    if (dir.x === -1) return 0;
    if (dir.y === 1) return Math.PI / 2;
    return -Math.PI / 2;
  }

  function drawJerryCan(px, py, size, dir) {
    ctx.save();
    ctx.translate(px + size / 2, py + size / 2);
    ctx.rotate(directionAngle(dir));

    if (jerryCanImg.complete && jerryCanImg.naturalWidth) {
      const drawSize = size + 2;
      ctx.drawImage(jerryCanImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
      return;
    }

    const w = size - 4;
    const h = size - 2;
    const x = -w / 2;
    const y = -h / 2 + 1;

    ctx.strokeStyle = COLORS.yellowDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, y - 1);
    ctx.quadraticCurveTo(0, y - h * 0.42, w * 0.22, y - 1);
    ctx.stroke();

    ctx.fillStyle = COLORS.yellow;
    ctx.strokeStyle = COLORS.yellowDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawWaterDroplet(x, y) {
    const px = x * GRID;
    const py = y * GRID;

    if (dropletImg.complete && dropletImg.naturalWidth) {
      ctx.drawImage(dropletImg, px + 1, py - 1, GRID - 2, GRID + 2);
      return;
    }

    const cx = px + GRID / 2;
    const cy = py + GRID / 2 + 1;
    const scale = GRID * 0.38;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(94, 212, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, scale * 0.15, scale * 0.9, scale * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(-scale * 0.2, -scale * 0.3, 0, 0, 0, scale);
    grad.addColorStop(0, COLORS.dropletHighlight);
    grad.addColorStop(0.55, COLORS.droplet);
    grad.addColorStop(1, "#2BA8D4");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -scale);
    ctx.bezierCurveTo(scale * 0.75, -scale * 0.35, scale * 0.75, scale * 0.45, 0, scale * 0.85);
    ctx.bezierCurveTo(-scale * 0.75, scale * 0.45, -scale * 0.75, -scale * 0.35, 0, -scale);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawWaterDroplet(food.x, food.y);
    snake.forEach((segment, i) => {
      drawSnakeSegment(segment.x, segment.y, i === 0);
    });
  }

  function setDirection(x, y) {
    if (!running) return;
    if (x === -direction.x && y === -direction.y) return;
    nextDirection = { x, y };
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") {
      e.preventDefault();
      setDirection(0, -1);
    } else if (key === "arrowdown" || key === "s") {
      e.preventDefault();
      setDirection(0, 1);
    } else if (key === "arrowleft" || key === "a") {
      e.preventDefault();
      setDirection(-1, 0);
    } else if (key === "arrowright" || key === "d") {
      e.preventDefault();
      setDirection(1, 0);
    }
  }

  function onTouchStart(e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e) {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }

  startBtn.addEventListener("click", startGame);
  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  resetGame();
  draw();
  showOverlay(
    "Ready to play?",
    "Collect water droplets with your jerry can. Arrow keys or swipe to move.",
    "Start Game"
  );
})();
