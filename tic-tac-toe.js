(function () {
  var board = ["", "", "", "", "", "", "", "", ""];
  var currentPlayer = "X";
  var isActive = true;
  var winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  var cells = document.querySelectorAll(".ttt-cell");
  var statusEl = document.getElementById("gameStatus");
  var resetButton = document.getElementById("resetTicTacToe");

  if (!cells.length || !statusEl || !resetButton) {
    return;
  }

  function checkWin(player) {
    for (var i = 0; i < winningLines.length; i++) {
      var line = winningLines[i];
      if (
        board[line[0]] === player &&
        board[line[1]] === player &&
        board[line[2]] === player
      ) {
        return line;
      }
    }
    return null;
  }

  function setBoardDisabled(disabled) {
    for (var i = 0; i < cells.length; i++) {
      cells[i].disabled = disabled;
    }
  }

  function handleMove(index) {
    if (!isActive || board[index] !== "") {
      return;
    }

    board[index] = currentPlayer;
    cells[index].textContent = currentPlayer;

    var winningLine = checkWin(currentPlayer);
    if (winningLine) {
      isActive = false;
      statusEl.textContent = "Player " + currentPlayer + " wins!";
      for (var i = 0; i < winningLine.length; i++) {
        cells[winningLine[i]].classList.add("win");
      }
      setBoardDisabled(true);
      return;
    }

    var hasOpenCell = board.indexOf("") !== -1;
    if (!hasOpenCell) {
      isActive = false;
      statusEl.textContent = "It's a draw.";
      setBoardDisabled(true);
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusEl.textContent = "Player " + currentPlayer + "'s turn.";
  }

  function resetGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isActive = true;
    statusEl.textContent = "Player X's turn.";

    for (var i = 0; i < cells.length; i++) {
      cells[i].textContent = "";
      cells[i].classList.remove("win");
    }
    setBoardDisabled(false);
  }

  for (var i = 0; i < cells.length; i++) {
    cells[i].addEventListener("click", function (event) {
      var index = Number(event.currentTarget.getAttribute("data-index"));
      handleMove(index);
    });
  }

  resetButton.addEventListener("click", resetGame);
})();
