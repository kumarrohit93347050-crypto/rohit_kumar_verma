const cells = document.querySelectorAll(".cell");

const statusText = document.getElementById("status");

const scoreText = document.getElementById("score");

const restart = document.getElementById("restart");

let currentPlayer = "X";

let board = ["", "", "", "", "", "", "", "", ""];

let gameActive = true;

let scoreX = 0;
let scoreO = 0;

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Cell Click

cells.forEach((cell, index) => {

    cell.addEventListener("click", function() {

        if (board[index] !== "" || !gameActive) {
            return;
        }

        board[index] = currentPlayer;

        cell.textContent = currentPlayer;

        cell.disabled = true;

        checkWinner();

    });

});

// Check Winner

function checkWinner() {

    for (let pattern of winPatterns) {

        let [a, b, c] = pattern;

        if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {

            statusText.textContent =
                "Player " + currentPlayer + " Wins! 🎉";

            if (currentPlayer === "X") {
                scoreX++;
            } else {
                scoreO++;
            }

            gameActive = false;

            updateScore();

            return;
        }
    }

    if (!board.includes("")) {

        statusText.textContent = "Match Draw!";

        gameActive = false;

        return;
    }

    currentPlayer =
        currentPlayer === "X" ? "O" : "X";

    statusText.textContent =
        "Player " + currentPlayer + "'s Turn";

}

// Update Score

function updateScore() {

    scoreText.textContent =
        "X: " + scoreX + " | O: " + scoreO;

}

// Restart Game

restart.addEventListener("click", function() {

    board = ["", "", "", "", "", "", "", "", ""];

    currentPlayer = "X";

    gameActive = true;

    cells.forEach(cell => {

        cell.textContent = "";

        cell.disabled = false;

    });

    statusText.textContent = "Player X's Turn";

});