const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Game elements
let player;
let traffic = [];

let score = 0;
let best = Number(localStorage.getItem("racingBest")) || 0;

let speed = 300;
let roadOffset = 0;
let spawnTimer = 0;
let lastTime = 0;

let gameRunning = false;
let gameOver = false;
let paused = false;

let keys = {
    left: false,
    right: false
};

const lanes = [0, 1, 2];

// Screen elements
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const speedText = document.getElementById("speed");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");

// Best score
bestText.innerText = best;

// Player car
function createPlayer() {
    return {
        x: W / 2,
        y: 565,
        width: 52,
        height: 90,
        moveSpeed: 300
    };
}

// Road perspective
function roadWidth(y) {
    let t = (y - 130) / (H - 130);
    return 55 + t * 140;
}

function roadX(lane, y) {
    let t = (y - 130) / (H - 130);
    let center = W / 2;
    let width = roadWidth(y);

    return center + (lane - 1) * width * 0.62;
}

// Draw road
function drawRoad() {

    // Sky
    let sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#071a38");
    sky.addColorStop(1, "#174d32");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Grass
    ctx.fillStyle = "#176b35";
    ctx.fillRect(0, 130, W, H - 130);

    // Road shape
    ctx.beginPath();
    ctx.moveTo(170, 130);
    ctx.lineTo(280, 130);
    ctx.lineTo(415, H);
    ctx.lineTo(35, H);
    ctx.closePath();

    let roadGradient = ctx.createLinearGradient(0, 130, 0, H);
    roadGradient.addColorStop(0, "#555555");
    roadGradient.addColorStop(1, "#202020");

    ctx.fillStyle = roadGradient;
    ctx.fill();

    // Road borders
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(170, 130);
    ctx.lineTo(35, H);
    ctx.moveTo(280, 130);
    ctx.lineTo(415, H);
    ctx.stroke();

    // Lane markings
    for (let lane = 1; lane <= 2; lane++) {

        for (let i = 0; i < 12; i++) {

            let y = 145 + ((i * 75 + roadOffset) % 600);
            let t = (y - 130) / (H - 130);

            let x = W / 2 + (lane - 1.5) * roadWidth(y) * 0.65;

            let lineHeight = 8 + t * 28;
            let lineWidth = 2 + t * 5;

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(
                x - lineWidth / 2,
                y,
                lineWidth,
                lineHeight
            );
        }
    }

    // Roadside lights
    for (let i = 0; i < 9; i++) {

        let y = 150 + ((i * 85 + roadOffset * 0.7) % 550);
        let t = (y - 130) / (H - 130);

        let xLeft = W / 2 - roadWidth(y) - 12;
        let xRight = W / 2 + roadWidth(y) + 12;

        let size = 3 + t * 5;

        ctx.fillStyle = "#ffe66d";

        ctx.fillRect(xLeft, y, size, size * 2);
        ctx.fillRect(xRight, y, size, size * 2);
    }
}

// Draw car
function drawCar(x, y, width, height, color, isPlayer = false) {

    ctx.save();

    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, height * 0.45, width * 0.65, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = "#080808";

    ctx.fillRect(-width * 0.55, -height * 0.28, width * 0.18, height * 0.30);
    ctx.fillRect(width * 0.37, -height * 0.28, width * 0.18, height * 0.30);

    ctx.fillRect(-width * 0.55, height * 0.20, width * 0.18, height * 0.30);
    ctx.fillRect(width * 0.37, height * 0.20, width * 0.18, height * 0.30);

    // Main body
    let gradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);

    gradient.addColorStop(0, "#222222");
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, "#111111");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(
        -width / 2,
        -height / 2,
        width,
        height,
        width * 0.20
    );
    ctx.fill();

    // Front glass
    ctx.fillStyle = "#8dd8ef";

    ctx.beginPath();
    ctx.roundRect(
        -width * 0.34,
        -height * 0.30,
        width * 0.68,
        height * 0.24,
        6
    );
    ctx.fill();

    // Rear glass
    ctx.fillStyle = "#29465c";

    ctx.fillRect(
        -width * 0.32,
        height * 0.10,
        width * 0.64,
        height * 0.18
    );

    // Headlights
    ctx.fillStyle = "#ffff99";

    ctx.fillRect(-width * 0.38, -height * 0.46, width * 0.23, height * 0.08);
    ctx.fillRect(width * 0.15, -height * 0.46, width * 0.23, height * 0.08);

    // Tail lights
    ctx.fillStyle = "#ff1717";

    ctx.fillRect(-width * 0.38, height * 0.38, width * 0.23, height * 0.08);
    ctx.fillRect(width * 0.15, height * 0.38, width * 0.23, height * 0.08);

    // Player indicator
    if (isPlayer) {
        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(-3, -height * 0.48, 6, 5);
    }

    ctx.restore();
}

// Create traffic
function createTraffic() {

    let lane = lanes[Math.floor(Math.random() * lanes.length)];

    traffic.push({
        lane: lane,
        y: 140,
        color: ["#ff3434", "#ffd43b", "#3498db", "#eeeeee", "#9b59b6"][
            Math.floor(Math.random() * 5)
        ]
    });
}

// Draw traffic
function drawTraffic() {

    traffic.forEach(car => {

        let t = (car.y - 130) / (H - 130);

        let width = 27 + t * 25;
        let height = 48 + t * 30;

        let x = roadX(car.lane, car.y);

        drawCar(x, car.y, width, height, car.color);
    });
}

// Draw player
function drawPlayer() {
    drawCar(
        player.x,
        player.y,
        player.width,
        player.height,
        "#00bfff",
        true
    );
}

// Collision detection
function checkCollision() {

    for (let car of traffic) {

        let x = roadX(car.lane, car.y);

        let t = Math.max(0, Math.min(1, (car.y - 130) / (H - 130)));

        let carWidth = 27 + t * 25;
        let carHeight = 48 + t * 30;

        let hitX = Math.abs(player.x - x) <
                   (player.width + carWidth) / 2 - 9;

        let hitY = Math.abs(player.y - car.y) <
                   (player.height + carHeight) / 2 - 12;

        if (hitX && hitY) {
            endGame();
            return;
        }
    }
}

// Update game
function update(delta) {

    let dt = Math.min(delta / 1000, 0.04);

    // Car movement
    if (keys.left) {
        player.x -= player.moveSpeed * dt;
    }

    if (keys.right) {
        player.x += player.moveSpeed * dt;
    }

    // Road boundaries
    player.x = Math.max(85, Math.min(365, player.x));

    // Road movement
    roadOffset += speed * dt;
    roadOffset %= 600;

    // Traffic spawning
    spawnTimer += dt;

    let spawnDelay = Math.max(0.65, 1.35 - score / 2500);

    if (spawnTimer > spawnDelay) {
        createTraffic();
        spawnTimer = 0;
    }

    // Traffic movement
    traffic.forEach(car => {
        car.y += speed * dt;
    });

    // Remove old cars and increase score
    traffic = traffic.filter(car => {
        if (car.y > H + 70) {
            score += 10;
            return false;
        }

        return true;
    });

    // Increase speed
    speed = Math.min(700, 300 + score * 0.5);

    // Collision
    checkCollision();

    // Update dashboard
    scoreText.innerText = score;
    speedText.innerText = Math.round(speed / 5);
}

// Main game drawing
function draw() {

    drawRoad();
    drawTraffic();
    drawPlayer();
}

// Game loop
function gameLoop(time) {

    if (!gameRunning || paused) return;

    let delta = time - lastTime;
    lastTime = time;

    update(delta);
    draw();

    if (gameRunning && !paused) {
        requestAnimationFrame(gameLoop);
    }
}

// Start game
function startGame() {

    score = 0;
    speed = 300;
    roadOffset = 0;
    spawnTimer = 0;

    traffic = [];
    player = createPlayer();

    gameOver = false;
    paused = false;
    gameRunning = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    lastTime = performance.now();

    draw();

    requestAnimationFrame(gameLoop);
}

// Game over
function endGame() {

    gameRunning = false;
    gameOver = true;

    if (score > best) {
        best = score;
        localStorage.setItem("racingBest", best);
    }

    bestText.innerText = best;
    document.getElementById("finalScore").innerText = score;

    gameOverScreen.classList.remove("hidden");
}

// Pause game
function pauseGame() {

    if (!gameRunning || gameOver) return;

    paused = true;
    pauseScreen.classList.remove("hidden");
}

// Resume game
function resumeGame() {

    paused = false;
    pauseScreen.classList.add("hidden");

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown", e => {

    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        keys.right = true;
    }

    if (e.key.toLowerCase() === "p" && gameRunning) {
        if (paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

document.addEventListener("keyup", e => {

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

// Mobile touch controls
function holdButton(id, direction) {

    const button = document.getElementById(id);

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        keys[direction] = true;
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach(event => {
        button.addEventListener(event, () => {
            keys[direction] = false;
        });
    });
}

holdButton("leftBtn", "left");
holdButton("rightBtn", "right");

// Button events
document.getElementById("startBtn").onclick = startGame;

document.getElementById("restartBtn").onclick = startGame;

document.getElementById("pauseBtn").onclick = () => {
    if (paused) {
        resumeGame();
    } else {
        pauseGame();
    }
};

document.getElementById("resumeBtn").onclick = resumeGame;

// Initial screen
player = createPlayer();
draw();