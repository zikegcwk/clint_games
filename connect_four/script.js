// Dimensions and colors matching the Python version
const ROWS = 6;
const COLS = 7;
const SQUARE_SIZE = 100; // canvas is 700x700
const RADIUS = Math.floor(SQUARE_SIZE / 2 - 5);

const COLORS = {
  BLUE: 'rgb(65, 105, 225)',
  BLACK: 'rgb(0,0,0)',
  RED: 'rgb(220, 20, 60)',
  YELLOW: 'rgb(255, 223, 0)',
  WHITE: 'rgb(255,255,255)'
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function getCanvasScaleX() {
  // Map from CSS pixels to canvas coordinate space
  const rect = canvas.getBoundingClientRect();
  return canvas.width / rect.width;
}

// UI elements
const mainMenu = document.getElementById('main-menu');
const endMenu = document.getElementById('end-menu');
const goodbye = document.getElementById('goodbye');
const totalPlayTimeEl = document.getElementById('total-play-time');
const winnerTextEl = document.getElementById('winner-text');
const gameTimeEl = document.getElementById('game-time');
const winnerBanner = document.getElementById('winner-banner');
const winnerBannerText = document.getElementById('winner-banner-text');

// Buttons
const btn2P = document.getElementById('btn-2p');
const btnAI = document.getElementById('btn-ai');
const btnExit = document.getElementById('btn-exit');
const btnContinue = document.getElementById('btn-continue');

let running = true; // simulated; closing tab ends app
let inMainMenu = true;
let vsAI = false;
let totalPlaySeconds = 0;
let gameStartEpoch = 0;

// Game state
let board = createBoard(); // 0 empty, 1 P1 red, 2 P2/AI yellow
let turn = 1;
let gameOver = false;
let winningPieces = []; // [ [r,c], ... ]

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
  const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const secs = String(s % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function updateTotalTimeUI() {
  totalPlayTimeEl.textContent = formatTime(totalPlaySeconds);
}

function drawBoard(flashWinners = false) {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Blue board background except top row (drop area height = 100)
  ctx.fillStyle = COLORS.BLUE;
  ctx.fillRect(0, SQUARE_SIZE, canvas.width, canvas.height - SQUARE_SIZE);

  // Board holes
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cx = Math.floor(c * SQUARE_SIZE + SQUARE_SIZE / 2);
      const cy = canvas.height - Math.floor((ROWS - r) * SQUARE_SIZE - SQUARE_SIZE / 2);
      drawCircle(cx, cy, RADIUS, COLORS.BLACK, true);
    }
  }

  // Pieces
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const v = board[r][c];
      if (v === 0) continue;

      const base = v === 1 ? COLORS.RED : COLORS.YELLOW;
      const isWinner = winningPieces.some(([wr, wc]) => wr === r && wc === c);
      const color = isWinner && flashWinners ? COLORS.WHITE : base;

      const cx = Math.floor(c * SQUARE_SIZE + SQUARE_SIZE / 2);
      const cy = canvas.height - Math.floor((ROWS - r) * SQUARE_SIZE - SQUARE_SIZE / 2);
      drawCircle(cx, cy, RADIUS, color, false);

      if (isWinner) {
        // Highlight ring
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.WHITE;
        ctx.beginPath();
        ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Winning line
  if (gameOver && winningPieces.length === 4) {
    const [startR, startC] = winningPieces[0];
    const [endR, endC] = winningPieces[3];
    const startX = Math.floor(startC * SQUARE_SIZE + SQUARE_SIZE / 2);
    const startY = canvas.height - Math.floor((ROWS - startR) * SQUARE_SIZE - SQUARE_SIZE / 2);
    const endX = Math.floor(endC * SQUARE_SIZE + SQUARE_SIZE / 2);
    const endY = canvas.height - Math.floor((ROWS - endR) * SQUARE_SIZE - SQUARE_SIZE / 2);

    ctx.strokeStyle = COLORS.WHITE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawCircle(x, y, r, fill, hole = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (hole) {
    ctx.fillStyle = fill;
    ctx.fill();
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function isValidLocation(col) {
  return board[0][col] === 0;
}

function getValidMoves() {
  const moves = [];
  for (let c = 0; c < COLS; c++) if (isValidLocation(c)) moves.push(c);
  return moves;
}

function dropPiece(col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      board[row][col] = turn;
      return true;
    }
  }
  return false;
}

function checkWin() {
  // Reset winners when checking
  winningPieces = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === turn &&
          board[r][c + 1] === turn &&
          board[r][c + 2] === turn &&
          board[r][c + 3] === turn) {
        winningPieces = [[r, c],[r, c+1],[r, c+2],[r, c+3]];
        return true;
      }
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === turn &&
          board[r + 1][c] === turn &&
          board[r + 2][c] === turn &&
          board[r + 3][c] === turn) {
        winningPieces = [[r, c],[r+1, c],[r+2, c],[r+3, c]];
        return true;
      }
    }
  }
  // Diagonal +
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === turn &&
          board[r + 1][c + 1] === turn &&
          board[r + 2][c + 2] === turn &&
          board[r + 3][c + 3] === turn) {
        winningPieces = [[r, c],[r+1, c+1],[r+2, c+2],[r+3, c+3]];
        return true;
      }
    }
  }
  // Diagonal -
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === turn &&
          board[r - 1][c + 1] === turn &&
          board[r - 2][c + 2] === turn &&
          board[r - 3][c + 3] === turn) {
        winningPieces = [[r, c],[r-1, c+1],[r-2, c+2],[r-3, c+3]];
        return true;
      }
    }
  }
  return false;
}

// AI evaluation
function evaluateWindow(window) {
  let score = 0;
  const aiPieces = window.filter(v => v === 2).length;
  const playerPieces = window.filter(v => v === 1).length;
  const empty = window.filter(v => v === 0).length;

  if (aiPieces === 4) score += 100;
  else if (aiPieces === 3 && empty === 1) score += 5;
  else if (aiPieces === 2 && empty === 2) score += 2;

  if (playerPieces === 3 && empty === 1) score -= 4;
  return score;
}

function scorePosition(b) {
  let score = 0;

  // Center column
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) if (b[r][centerCol] === 2) centerCount++;
  score += centerCount * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [b[r][c], b[r][c+1], b[r][c+2], b[r][c+3]];
      score += evaluateWindow(window);
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [b[r][c], b[r+1][c], b[r+2][c], b[r+3][c]];
      score += evaluateWindow(window);
    }
  }
  // Diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]]);
      score += evaluateWindow([b[r+3][c], b[r+2][c+1], b[r+1][c+2], b[r][c+3]]);
    }
  }
  return score;
}

function isTerminalNode(b) {
  return checkAnyWin(b, 1) || checkAnyWin(b, 2) || getValidMovesFrom(b).length === 0;
}

function getValidMovesFrom(b) {
  const moves = [];
  for (let c = 0; c < COLS; c++) if (b[0][c] === 0) moves.push(c);
  return moves;
}

function nextOpenRow(b, col) {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r][col] === 0) return r;
  return -1;
}

function dropOnBoard(b, row, col, player) {
  const clone = b.map(rowArr => rowArr.slice());
  clone[row][col] = player;
  return clone;
}

function checkAnyWin(b, player) {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r][c+1] === player && b[r][c+2] === player && b[r][c+3] === player) return true;
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c] === player && b[r+1][c] === player && b[r+2][c] === player && b[r+3][c] === player) return true;
    }
  }
  // Diagonal +
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r+1][c+1] === player && b[r+2][c+2] === player && b[r+3][c+3] === player) return true;
    }
  }
  // Diagonal -
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r-1][c+1] === player && b[r-2][c+2] === player && b[r-3][c+3] === player) return true;
    }
  }
  return false;
}

function minimax(b, depth, alpha, beta, maximizing) {
  const validMoves = getValidMovesFrom(b);
  const terminal = isTerminalNode(b);
  if (depth === 0 || terminal) {
    if (terminal) {
      if (checkAnyWin(b, 2)) return [null, 1e15];
      if (checkAnyWin(b, 1)) return [null, -1e15];
      return [null, 0];
    }
    return [null, scorePosition(b)];
  }

  if (maximizing) { // AI
    let value = -Infinity;
    let bestCol = validMoves[0];
    for (const col of validMoves) {
      const row = nextOpenRow(b, col);
      const newBoard = dropOnBoard(b, row, col, 2);
      const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, false);
      if (newScore > value) { value = newScore; bestCol = col; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else { // Minimizing - player
    let value = Infinity;
    let bestCol = validMoves[0];
    for (const col of validMoves) {
      const row = nextOpenRow(b, col);
      const newBoard = dropOnBoard(b, row, col, 1);
      const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, true);
      if (newScore < value) { value = newScore; bestCol = col; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

function getAiMove() {
  const [col] = minimax(board, 5, -Infinity, Infinity, true);
  return col;
}

// Interaction
let hoverX = null; // pixel x for hover disc

canvas.addEventListener('mousemove', (e) => {
  if (inMainMenu || gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = getCanvasScaleX();
  hoverX = Math.floor((e.clientX - rect.left) * scaleX);
  drawTopHover();
});

canvas.addEventListener('mouseleave', () => {
  hoverX = null;
  if (!inMainMenu) drawTopHover();
});

canvas.addEventListener('mousedown', async (e) => {
  if (inMainMenu || gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = getCanvasScaleX();
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const col = Math.floor(x / SQUARE_SIZE);
  if (col < 0 || col >= COLS || !isValidLocation(col)) return;

  if (dropPiece(col)) {
    if (checkWin()) {
      onGameOver();
    } else if (getValidMoves().length === 0) {
      onDraw();
    } else {
      turn = 3 - turn;
      drawBoard();

      if (vsAI && turn === 2 && !gameOver) {
        await sleep(300);
        const aiCol = getAiMove();
        if (dropPiece(aiCol)) {
          if (checkWin()) {
            onGameOver();
          } else if (getValidMoves().length === 0) {
            onDraw();
          } else {
            turn = 3 - turn;
            drawBoard();
          }
        }
      }
    }
  }
});

function drawTopHover() {
  drawBoard();
  // top row area
  ctx.fillStyle = COLORS.BLACK;
  ctx.fillRect(0, 0, canvas.width, SQUARE_SIZE);
  if (hoverX != null) {
    const color = turn === 1 ? COLORS.RED : COLORS.YELLOW;
    drawCircle(hoverX, Math.floor(SQUARE_SIZE / 2), RADIUS, color, false);
  }
}

function onGameOver() {
  gameOver = true;
  drawBoard();
  const winner = 3 - turn; // last player to move
  const text = `Player ${winner} wins!`;

  // add play time
  const gameSec = (Date.now() - gameStartEpoch) / 1000;
  totalPlaySeconds += gameSec;
  updateTotalTimeUI();

  // flash winners
  (async () => {
    for (let i = 0; i < 6; i++) { // 3 times on/off
      drawBoard(true); await sleep(200);
      drawBoard(false); await sleep(200);
    }
    // show banner then end menu
    winnerBannerText.textContent = text;
    winnerBanner.classList.remove('hidden');
    await sleep(2000);
    winnerBanner.classList.add('hidden');

    winnerTextEl.textContent = text;
    gameTimeEl.textContent = formatTime(gameSec);
    endMenu.classList.remove('hidden');
  })();
}

function onDraw() {
  gameOver = true;
  drawBoard();
  const text = `It's a draw!`;

  // add play time
  const gameSec = (Date.now() - gameStartEpoch) / 1000;
  totalPlaySeconds += gameSec;
  updateTotalTimeUI();

  (async () => {
    // show banner then end menu (no winner flashing)
    winnerBannerText.textContent = text;
    winnerBanner.classList.remove('hidden');
    await sleep(2000);
    winnerBanner.classList.add('hidden');

    winnerTextEl.textContent = text;
    gameTimeEl.textContent = formatTime(gameSec);
    endMenu.classList.remove('hidden');
  })();
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// Menus
btn2P.addEventListener('click', () => startGame(false));
btnAI.addEventListener('click', () => startGame(true));
btnExit.addEventListener('click', () => {
  // For web, simulate exit by hiding UI
  mainMenu.classList.add('hidden');
  mainMenu.classList.remove('visible');
  goodbye.classList.remove('hidden');
});

btnContinue.addEventListener('click', () => {
  endMenu.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  mainMenu.classList.add('visible');
  inMainMenu = true;
});

function startGame(vsAiMode) {
  vsAI = vsAiMode;
  inMainMenu = false;
  mainMenu.classList.add('hidden');
  mainMenu.classList.remove('visible');
  endMenu.classList.add('hidden');
  goodbye.classList.add('hidden');

  // Reset game
  board = createBoard();
  turn = 1;
  gameOver = false;
  winningPieces = [];
  hoverX = null;
  gameStartEpoch = Date.now();

  drawBoard();
  drawTopHover();
}

// Initial draw
updateTotalTimeUI();
drawBoard();


