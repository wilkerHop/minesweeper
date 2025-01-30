/**
 * Number of rows in the game board.
 * @type {number}
 */
const ROWS = 10;

/**
 * Number of columns in the game board.
 * @type {number}
 */
const COLS = 10;

/**
 * Number of mines to be placed on the board.
 * @type {number}
 */
const MINES = 15;

/**
 * 2D array representing the game board.
 * Each cell is an object with properties: isMine, isRevealed, isFlagged, adjacentMines.
 * @type {Array<Array<{isMine: boolean, isRevealed: boolean, isFlagged: boolean, adjacentMines: number}>>}
 */
let board = [];

/**
 * Indicates whether the game is over.
 * @type {boolean}
 */
let gameOver = false;

/**
 * Tracks whether the first cell has been clicked.
 * @type {boolean}
 */
let firstClick = true;

/**
 * Reference to the HTML element representing the game board.
 * @type {HTMLElement}
 */
const boardElement = document.querySelector('.board');

/**
 * Reference to the HTML element displaying the game status.
 * @type {HTMLElement}
 */
const statusElement = document.querySelector('.status');

/**
 * Reference to the reset button HTML element.
 * @type {HTMLElement}
 */
const resetButton = document.querySelector('.reset-button');

/**
 * Initializes the game by resetting the board and game state.
 * @returns {void}
 */
function initializeGame() {
  gameOver = false;
  firstClick = true;
  statusElement.textContent = '';
  boardElement.innerHTML = '';
  board = createBoard(ROWS, COLS);
  renderBoard(board);
}

/**
 * Creates a 2D array representing the game board.
 * @param {number} rows - Number of rows in the board.
 * @param {number} cols - Number of columns in the board.
 * @returns {Array<Array<{isMine: boolean, isRevealed: boolean, isFlagged: boolean, adjacentMines: number}>>} The initialized board.
 */
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

/**
 * Places mines randomly on the board, ensuring the first clicked cell and its neighbors are safe.
 * @param {Array<Array<{isMine: boolean}>>} board - The game board.
 * @param {number} mines - Number of mines to place.
 * @param {number} firstRow - Row index of the first clicked cell.
 * @param {number} firstCol - Column index of the first clicked cell.
 * @returns {void}
 */
function placeMines(board, mines, firstRow, firstCol) {
  let placedMines = 0;
  while (placedMines < mines) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    if (!board[row][col].isMine && !isAdjacent(firstRow, firstCol, row, col)) {
      board[row][col].isMine = true;
      placedMines++;
    }
  }
}

/**
 * Checks if a cell is adjacent to the first clicked cell.
 * @param {number} firstRow - Row index of the first clicked cell.
 * @param {number} firstCol - Column index of the first clicked cell.
 * @param {number} row - Row index of the cell to check.
 * @param {number} col - Column index of the cell to check.
 * @returns {boolean} True if the cell is adjacent, false otherwise.
 */
function isAdjacent(firstRow, firstCol, row, col) {
  return Math.abs(firstRow - row) <= 1 && Math.abs(firstCol - col) <= 1;
}

/**
 * Calculates the number of adjacent mines for each cell on the board.
 * @param {Array<Array<{isMine: boolean, adjacentMines: number}>>} board - The game board.
 * @returns {void}
 */
function calculateAdjacentMines(board) {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      if (!board[i][j].isMine) {
        board[i][j].adjacentMines = countAdjacentMines(board, i, j);
      }
    }
  }
}

/**
 * Counts the number of adjacent mines for a given cell.
 * @param {Array<Array<{isMine: boolean}>>} board - The game board.
 * @param {number} row - Row index of the cell.
 * @param {number} col - Column index of the cell.
 * @returns {number} The number of adjacent mines.
 */
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

/**
 * Renders the game board in the HTML.
 * @param {Array<Array<{isMine: boolean, isRevealed: boolean, isFlagged: boolean}>>} board - The game board.
 * @returns {void}
 */
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

/**
 * Handles left-click events on cells to reveal them.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleCellClick(event) {
  if (gameOver) return;
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  const cell = board[row][col];

  if (cell.isFlagged || cell.isRevealed) return;

  if (firstClick) {
    placeMines(board, MINES, row, col);
    calculateAdjacentMines(board);
    firstClick = false;
  }

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

/**
 * Handles right-click events on cells to toggle flags.
 * @param {MouseEvent} event - The contextmenu event.
 * @returns {void}
 */
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

/**
 * Reveals a cell and its neighbors if it has no adjacent mines.
 * @param {number} row - Row index of the cell.
 * @param {number} col - Column index of the cell.
 * @returns {void}
 */
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

/**
 * Reveals all mines on the board when the game is lost.
 * @returns {void}
 */
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

/**
 * Checks if the player has won the game by revealing all non-mine cells.
 * @returns {boolean} True if the player has won, false otherwise.
 */
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

// Event listener for the reset button
resetButton.addEventListener('click', initializeGame);

// Initialize the game on page load
initializeGame();
