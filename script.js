const ROWS = 10;
const COLS = 10;
const MINES = 15;

let board = [];
let gameOver = false;

const boardElement = document.querySelector('.board');
const statusElement = document.querySelector('.status');
const resetButton = document.querySelector('.reset-button');

// Initialize the game
function initializeGame() {
  gameOver = false;
  statusElement.textContent = '';
  boardElement.innerHTML = '';
  board = createBoard(ROWS, COLS);
  placeMines(board, MINES);
  calculateAdjacentMines(board);
  renderBoard(board);
}

// Create the board
function createBoard(rows, cols) {
  const board = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

// Place mines randomly
function placeMines(board, mines) {
  let placedMines = 0;
  while (placedMines < mines) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      placedMines++;
    }
  }
}

// Calculate adjacent mines for each cell
function calculateAdjacentMines(board) {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      if (!board[i][j].isMine) {
        board[i][j].adjacentMines = countAdjacentMines(board, i, j);
      }
    }
  }
}

// Count adjacent mines for a cell
function countAdjacentMines(board, row, col) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newRow = row + i;
      const newCol = col + j;
      if (
        newRow >= 0 &&
        newRow < ROWS &&
        newCol >= 0 &&
        newCol < COLS &&
        board[newRow][newCol].isMine
      ) {
        count++;
      }
    }
  }
  return count;
}

// Render the board
function renderBoard(board) {
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
  boardElement.style.gridTemplateRows = `repeat(${ROWS}, 30px)`;
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleCellRightClick);
      boardElement.appendChild(cell);
    }
  }
}

// Handle left-click (reveal cell)
function handleCellClick(event) {
  if (gameOver) return;
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  const cell = board[row][col];
  if (cell.isFlagged || cell.isRevealed) return;

  if (cell.isMine) {
    revealAllMines();
    statusElement.textContent = 'Game Over! You hit a mine.';
    gameOver = true;
    return;
  }

  revealCell(row, col);
  if (checkWin()) {
    statusElement.textContent = 'Congratulations! You won!';
    gameOver = true;
  }
}

// Handle right-click (flag cell)
function handleCellRightClick(event) {
  event.preventDefault();
  if (gameOver) return;
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  const cell = board[row][col];
  if (cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  event.target.classList.toggle('flagged', cell.isFlagged);
}

// Reveal a cell and its neighbors (if no adjacent mines)
function revealCell(row, col) {
  const cell = board[row][col];
  if (cell.isRevealed || cell.isFlagged) return;

  cell.isRevealed = true;
  const cellElement = document.querySelector(
    `.cell[data-row="${row}"][data-col="${col}"]`
  );
  cellElement.classList.add('revealed');

  if (cell.adjacentMines > 0) {
    cellElement.textContent = cell.adjacentMines;
  } else {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
          revealCell(newRow, newCol);
        }
      }
    }
  }
}

// Reveal all mines (on game over)
function revealAllMines() {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const cell = board[i][j];
      if (cell.isMine) {
        const cellElement = document.querySelector(
          `.cell[data-row="${i}"][data-col="${j}"]`
        );
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
      }
    }
  }
}

// Check if the player has won
function checkWin() {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const cell = board[i][j];
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

// Reset the game
resetButton.addEventListener('click', initializeGame);

// Start the game
initializeGame();
