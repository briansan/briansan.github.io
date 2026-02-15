(function () {
  var ROWS = 6;
  var COLS = 7;
  var board = [];
  var cells = [];
  var currentPlayer = "R";
  var isActive = true;

  var boardEl = document.getElementById("connect4Board");
  var statusEl = document.getElementById("connect4Status");
  var resetButton = document.getElementById("resetConnect4");

  if (!boardEl || !statusEl || !resetButton) {
    return;
  }

  function initializeBoardState() {
    board = [];
    for (var row = 0; row < ROWS; row++) {
      var rowData = [];
      for (var col = 0; col < COLS; col++) {
        rowData.push("");
      }
      board.push(rowData);
    }
  }

  function createBoardUi() {
    boardEl.innerHTML = "";
    cells = [];

    for (var row = 0; row < ROWS; row++) {
      var uiRow = [];
      for (var col = 0; col < COLS; col++) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "c4-cell";
        cell.setAttribute("data-row", String(row));
        cell.setAttribute("data-col", String(col));
        cell.setAttribute("aria-label", "Row " + (row + 1) + ", Column " + (col + 1));
        cell.addEventListener("click", onCellClick);

        boardEl.appendChild(cell);
        uiRow.push(cell);
      }
      cells.push(uiRow);
    }
  }

  function onCellClick(event) {
    if (!isActive) {
      return;
    }

    var col = Number(event.currentTarget.getAttribute("data-col"));
    handleMove(col);
  }

  function findOpenRow(col) {
    for (var row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === "") {
        return row;
      }
    }
    return -1;
  }

  function isBoardFull() {
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        if (board[row][col] === "") {
          return false;
        }
      }
    }
    return true;
  }

  function tokenLabel(player) {
    return player === "R" ? "Red" : "Yellow";
  }

  function setCellToken(row, col, player) {
    var cell = cells[row][col];
    cell.classList.remove("p1", "p2", "win");
    cell.classList.add(player === "R" ? "p1" : "p2");
    cell.setAttribute("aria-label", "Row " + (row + 1) + ", Column " + (col + 1) + ", " + tokenLabel(player));
  }

  function checkDirection(row, col, deltaRow, deltaCol, player) {
    var line = [[row, col]];

    var r = row + deltaRow;
    var c = col + deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      line.push([r, c]);
      r += deltaRow;
      c += deltaCol;
    }

    r = row - deltaRow;
    c = col - deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      line.push([r, c]);
      r -= deltaRow;
      c -= deltaCol;
    }

    return line;
  }

  function checkWin(row, col, player) {
    var directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (var i = 0; i < directions.length; i++) {
      var direction = directions[i];
      var winningLine = checkDirection(row, col, direction[0], direction[1], player);
      if (winningLine.length >= 4) {
        return winningLine;
      }
    }

    return null;
  }

  function setBoardDisabled(disabled) {
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        cells[row][col].disabled = disabled;
      }
    }
  }

  function highlightWinningLine(line) {
    for (var i = 0; i < line.length; i++) {
      var row = line[i][0];
      var col = line[i][1];
      cells[row][col].classList.add("win");
    }
  }

  function handleMove(col) {
    var row = findOpenRow(col);
    if (row === -1) {
      return;
    }

    board[row][col] = currentPlayer;
    setCellToken(row, col, currentPlayer);

    var winningLine = checkWin(row, col, currentPlayer);
    if (winningLine) {
      isActive = false;
      highlightWinningLine(winningLine);
      statusEl.textContent = "Player " + tokenLabel(currentPlayer) + " wins!";
      setBoardDisabled(true);
      return;
    }

    if (isBoardFull()) {
      isActive = false;
      statusEl.textContent = "It's a draw.";
      setBoardDisabled(true);
      return;
    }

    currentPlayer = currentPlayer === "R" ? "Y" : "R";
    statusEl.textContent = "Player " + tokenLabel(currentPlayer) + "'s turn.";
  }

  function resetGame() {
    currentPlayer = "R";
    isActive = true;
    statusEl.textContent = "Player Red's turn.";
    initializeBoardState();
    createBoardUi();
    setBoardDisabled(false);
  }

  resetButton.addEventListener("click", resetGame);

  resetGame();
})();
