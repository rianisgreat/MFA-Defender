
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const waveText = document.getElementById("wave");
const defenseText = document.getElementById("defense");
const powerupStatus = document.getElementById("powerupStatus");

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const endScreen = document.getElementById("endScreen");

const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const restartButton = document.getElementById("restartButton");

const questionTitle = document.getElementById("questionTitle");
const questionText = document.getElementById("question");
const answersDiv = document.getElementById("answers");
const feedback = document.getElementById("feedback");

const questions = [
    {
        question: "What does MFA stand for?",
        answers: [
            "Multiple File Access",
            "Multifactor Authentication",
            "Main Firewall Application",
            "Managed File Account"
        ],
        correct: 1,
        explanation: "MFA stands for Multifactor Authentication. It adds another verification step to protect your account.",
        reward: "Shield Boost"
    },
    {
        question: "Which of these is something you HAVE?",
        answers: [
            "Your password",
            "Your fingerprint",
            "A security key",
            "Your username"
        ],
        correct: 2,
        explanation: "A security key is something you physically have. It can be used as an additional authentication factor.",
        reward: "Rapid Fire"
    },
    {
        question: "Why should you turn on MFA?",
        answers: [
            "It makes your internet faster",
            "It adds another layer of account security",
            "It removes all viruses",
            "It makes passwords unnecessary in every situation"
        ],
        correct: 1,
        explanation: "MFA makes it harder for someone to access your account with only a stolen password.",
        reward: "Extra Life"
    },
    {
        question: "Which is an example of an MFA method?",
        answers: [
            "An authenticator app",
            "A regular search engine",
            "A social media post",
            "A computer wallpaper"
        ],
        correct: 0,
        explanation: "Authenticator apps generate verification codes that can provide an additional authentication step.",
        reward: "Shield + Rapid Fire"
    },
    {
        question: "You receive an unexpected sign-in approval request. What should you do?",
        answers: [
            "Approve it immediately",
            "Ignore the warning and share the code",
            "Reject it and report it if possible",
            "Send the request to a friend"
        ],
        correct: 2,
        explanation: "Never approve a sign-in you did not initiate. Reject it and report suspicious activity.",
        reward: "Final Defense Boost"
    }
];

let player;
let bullets = [];
let enemies = [];

let score = 0;
let lives = 5;
let wave = 1;
let questionIndex = 0;
let defense = 0;

let keys = {};
let gameRunning = false;
let quizOpen = false;

let shield = 0;
let rapidFire = 0;
let lastShot = 0;
let animationId = null;

function resetGame() {
    player = {
        x: canvas.width / 2 - 20,
        y: canvas.height - 65,
        width: 40,
        height: 35,
        speed: 5
    };

    bullets = [];
    enemies = [];

    score = 0;
    lives = 5;
    wave = 1;
    questionIndex = 0;
    defense = 0;

    shield = 0;
    rapidFire = 0;

    updateStats();
    powerupStatus.textContent = "No power-ups earned yet.";
}

function updateStats() {
    scoreText.textContent = score;
    livesText.textContent = lives;
    waveText.textContent = wave;
    defenseText.textContent = defense;
}

function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    resetGame();

    startScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");

    gameRunning = true;
    quizOpen = false;

    spawnEnemies();
    animationId = requestAnimationFrame(gameLoop);
}

function spawnEnemies() {
    enemies = [];

    const enemyCount = 6 + wave * 2;

    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: 30 + Math.random() * (canvas.width - 60),
            y: -Math.random() * 500 - 40,
            width: 30,
            height: 25,
            speed: 0.55 + wave * 0.14 + Math.random() * 0.25,
            health: 1,
            boss: false
        });
    }

    if (wave === 5) {
        enemies.push({
            x: canvas.width / 2 - 45,
            y: -130,
            width: 90,
            height: 60,
            speed: 0.85,
            health: 11,
            boss: true,
            direction: 1
        });
    }
}

function drawBackground() {
    ctx.fillStyle = "#020602";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#0b260b";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.fillStyle = "#39ff14";
    ctx.font = "13px Arial";
    ctx.fillText("SECURE THE ACCOUNT", 15, 22);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("LEVEL " + wave + " / 5", canvas.width - 110, 22);
}

function drawPlayer() {
    ctx.fillStyle = shield > 0 ? "#ffffff" : "#39ff14";
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    if (shield > 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            35,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.boss) {
            ctx.fillStyle = "#ff2222";
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 20;

            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px Arial";
            ctx.fillText("BOSS", enemy.x + 25, enemy.y + 35);

            ctx.fillStyle = "#222222";
            ctx.fillRect(enemy.x, enemy.y - 12, enemy.width, 7);

            ctx.fillStyle = "#39ff14";
            ctx.fillRect(
                enemy.x,
                enemy.y - 12,
                enemy.width * (enemy.health / 11),
                7
            );
        } else {
            ctx.fillStyle = "#ff4444";
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 12;

            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );

            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Arial";
            ctx.fillText("!", enemy.x + 11, enemy.y + 18);
        }

        ctx.shadowBlur = 0;
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = "#39ff14";
        ctx.shadowColor = "#39ff14";
        ctx.shadowBlur = 10;

        ctx.fillRect(bullet.x, bullet.y, 5, 13);

        ctx.shadowBlur = 0;
    });
}

function shoot() {
    const now = Date.now();
    const delay = rapidFire > 0 ? 220 : 350;

    if (now - lastShot < delay) return;

    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        speed: 8
    });

    lastShot = now;
}

function updatePlayer() {
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        player.x -= player.speed;
    }

    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        player.x += player.speed;
    }

    if (keys[" "]) {
        shoot();
    }

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.y -= bullet.speed;
    });

    bullets = bullets.filter(bullet => bullet.y > -20);
}

function loseLife() {
    if (shield > 0) return;

    lives--;
    updateStats();

    if (lives <= 0) {
        endGame(false);
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.boss) {
            enemy.y += enemy.speed;

            if (enemy.y > 45) {
                enemy.y = 45;
                enemy.x += enemy.direction * 1.1;

                if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                    enemy.direction *= -1;
                }
            }
        } else {
            enemy.y += enemy.speed;
        }

        if (
            enemy.y + enemy.height >= player.y &&
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x
        ) {
            enemy.y = canvas.height + 100;
            loseLife();
        }

        if (!enemy.boss && enemy.y > canvas.height) {
            enemy.y = canvas.height + 100;
            loseLife();
        }
    });

    enemies = enemies.filter(
        enemy => enemy.y < canvas.height + 50
    );
}

function checkCollisions() {
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 13 > enemy.y
            ) {
                bullet.y = -100;

                enemy.health--;

                if (enemy.health <= 0) {
                    enemy.y = canvas.height + 100;
                    score += enemy.boss ? 250 : 10;
                    updateStats();
                }
            }
        });
    });

    enemies = enemies.filter(
        enemy => enemy.y < canvas.height + 50
    );

    bullets = bullets.filter(
        bullet => bullet.y > -50
    );
}

function gameLoop() {
    if (!gameRunning || quizOpen) return;

    drawBackground();

    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();

    if (shield > 0) shield -= 0.5;
    if (rapidFire > 0) rapidFire -= 0.5;

    if (lives <= 0) return;

    if (enemies.length === 0) {
        openQuiz();
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

function openQuiz() {
    gameRunning = false;
    quizOpen = true;

    const currentQuestion = questions[questionIndex];

    questionTitle.textContent =
        "LEVEL " + wave + " CHECKPOINT";

    questionText.textContent = currentQuestion.question;

    answersDiv.innerHTML = "";
    feedback.textContent = "";
    continueButton.classList.add("hidden");

    currentQuestion.answers.forEach((answer, index) => {
        const button = document.createElement("button");

        button.textContent = answer;

        button.addEventListener("click", () => {
            checkAnswer(index);
        });

        answersDiv.appendChild(button);
    });

    quizScreen.classList.remove("hidden");
}

function checkAnswer(selectedIndex) {
    const currentQuestion = questions[questionIndex];
    const answerButtons = answersDiv.querySelectorAll("button");

    answerButtons.forEach(button => {
        button.disabled = true;
    });

    if (selectedIndex === currentQuestion.correct) {
        feedback.textContent =
            "CORRECT! POWER-UP UNLOCKED: " + currentQuestion.reward;

        feedback.style.color = "#39ff14";

        score += 100;
        defense = Math.min(100, defense + 20);

        if (questionIndex === 0) {
            shield = 700;
        } else if (questionIndex === 1) {
            rapidFire = 450;
        } else if (questionIndex === 2) {
            lives++;
        } else if (questionIndex === 3) {
            shield = 900;
            rapidFire = 500;
        } else if (questionIndex === 4) {
            shield = 1100;
            rapidFire = 550;
        }

        powerupStatus.textContent =
            currentQuestion.reward + " ACTIVATED!";
    } else {
        feedback.textContent =
            "NOT QUITE! " + currentQuestion.explanation;

        feedback.style.color = "#ff7777";
    }

    answerButtons[currentQuestion.correct].style.background =
        "#174817";

    answerButtons[currentQuestion.correct].style.color =
        "#ffffff";

    updateStats();

    continueButton.classList.remove("hidden");
}

function continueToNextWave() {
    quizScreen.classList.add("hidden");

    questionIndex++;

    if (questionIndex >= questions.length) {
        endGame(true);
        return;
    }

    wave++;
    updateStats();

    spawnEnemies();

    quizOpen = false;
    gameRunning = true;

    animationId = requestAnimationFrame(gameLoop);
}

function endGame(won) {
    gameRunning = false;
    quizOpen = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    quizScreen.classList.add("hidden");
    endScreen.classList.remove("hidden");

    if (won) {
        document.getElementById("endTitle").textContent =
            "ACCOUNT SECURED!";

        document.getElementById("endMessage").textContent =
            "You defeated every enemy, completed all five MFA challenges, and protected your account! Final score: " + score;
    } else {
        document.getElementById("endTitle").textContent =
            "MISSION FAILED";

        document.getElementById("endMessage").textContent =
            "Your account defenses were overwhelmed. Try again and use your MFA power-ups!";
    }
}

document.addEventListener("keydown", event => {
    keys[event.key] = true;

    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key)
    ) {
        event.preventDefault();
    }
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

startButton.addEventListener("click", startGame);
continueButton.addEventListener("click", continueToNextWave);
restartButton.addEventListener("click", startGame);

resetGame();
drawBackground();
drawPlayer();
