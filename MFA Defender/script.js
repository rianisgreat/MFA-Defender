
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
        explanation: "MFA stands for Multifactor Authentication. It requires more than one type of verification to protect an account."
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
        explanation: "A security key is something you physically possess. It can act as an additional authentication factor."
    },
    {
        question: "Why is MFA important?",
        answers: [
            "It makes your internet faster",
            "It adds another layer of account security",
            "It removes every computer virus",
            "It makes every password unnecessary"
        ],
        correct: 1,
        explanation: "Even if someone gets your password, MFA makes it harder for them to access your account."
    },
    {
        question: "Which is an example of an MFA method?",
        answers: [
            "An authenticator app",
            "A search engine",
            "A social media post",
            "A computer wallpaper"
        ],
        correct: 0,
        explanation: "Authenticator apps provide verification codes that can be used as an additional authentication factor."
    },
    {
        question: "You receive an unexpected sign-in approval request. What should you do?",
        answers: [
            "Approve it immediately",
            "Share your verification code",
            "Reject it and report it if possible",
            "Ignore the warning and approve it later"
        ],
        correct: 2,
        explanation: "Never approve a sign-in you did not initiate. Reject unexpected requests and report suspicious activity."
    }
];

let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let collectibles = [];

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

let mfaActive = false;
let mfaCharges = 0;
let mfaPulse = 0;
let pulseCooldown = 0;

let hasAuthenticator = false;
let hasSecurityKey = false;

let waveFactor = "app";

function resetGame() {
    player = {
        x: canvas.width / 2 - 20,
        y: canvas.height - 65,
        width: 40,
        height: 35,
        speed: 5
    };

    bullets = [];
    enemyBullets = [];
    enemies = [];
    collectibles = [];

    score = 0;
    lives = 5;
    wave = 1;
    questionIndex = 0;
    defense = 0;

    shield = 0;
    rapidFire = 0;

    mfaActive = false;
    mfaCharges = 0;
    mfaPulse = 0;
    pulseCooldown = 0;

    hasAuthenticator = false;
    hasSecurityKey = false;

    updateStats();

    powerupStatus.textContent =
        "PASSWORD ONLY: Find a second verification factor!";
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
    quizScreen.classList.add("hidden");
    endScreen.classList.add("hidden");

    gameRunning = true;
    quizOpen = false;

    spawnWave();

    animationId = requestAnimationFrame(gameLoop);
}

function spawnWave() {
    enemies = [];
    enemyBullets = [];
    bullets = [];
    collectibles = [];

    mfaActive = false;
    mfaCharges = 0;
    mfaPulse = 0;
    defense = 0;

    waveFactor = wave % 2 === 1 ? "app" : "key";

    const enemyCount = 5 + wave * 2;

    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: 30 + Math.random() * (canvas.width - 60),
            y: -Math.random() * 500 - 40,
            width: 30,
            height: 25,
            speed: 0.45 + wave * 0.12 + Math.random() * 0.2,
            health: 1,
            boss: false,
            lastAttack: Date.now() + Math.random() * 2500
        });
    }

    if (wave === 5) {
        enemies.push({
            x: canvas.width / 2 - 45,
            y: -130,
            width: 90,
            height: 60,
            speed: 0.75,
            health: 15,
            boss: true,
            direction: 1,
            lastAttack: Date.now()
        });
    }

    collectibles.push({
        type: waveFactor,
        x: canvas.width / 2 - 17,
        y: -70,
        width: 34,
        height: 34,
        speed: 1.1
    });

    powerupStatus.textContent =
        "PASSWORD ONLY: Find your " +
        (waveFactor === "app" ? "AUTHENTICATOR APP" : "SECURITY KEY") +
        " to activate MFA!";
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
    ctx.font = "bold 13px Arial";
    ctx.fillText("MFA DEFENDER", 15, 20);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("WAVE " + wave + " / 5", canvas.width - 100, 20);

    ctx.fillStyle = mfaActive ? "#39ff14" : "#ff5555";
    ctx.fillText(
        "MFA: " + (mfaActive ? "ACTIVE" : "PASSWORD ONLY"),
        15,
        43
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillText(
        "SECOND FACTOR: " + (mfaActive ? "VERIFIED" : "NOT VERIFIED"),
        15,
        63
    );

    ctx.fillStyle = "#39ff14";
    ctx.fillText("MFA SHIELDS: " + mfaCharges, 15, 83);

    if (!mfaActive) {
        ctx.fillStyle = "#ff5555";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
            "WARNING: YOUR PASSWORD ALONE IS NOT ENOUGH!",
            15,
            canvas.height - 15
        );
    } else {
        ctx.fillStyle = "#39ff14";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
            "TWO-FACTOR DEFENSE ACTIVE",
            15,
            canvas.height - 15
        );
    }
}

function drawPlayer() {
    ctx.fillStyle = "#39ff14";
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    if (mfaActive || shield > 0 || mfaPulse > 0) {
        ctx.strokeStyle = mfaPulse > 0 ? "#ffffff" : "#00ccff";
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
        ctx.fillStyle = "#ff3333";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 12;

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        ctx.shadowBlur = 0;

        if (enemy.boss) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 15px Arial";
            ctx.fillText("PASSWORD HACKER", enemy.x - 25, enemy.y - 8);

            ctx.fillStyle = "#333333";
            ctx.fillRect(enemy.x, enemy.y - 18, enemy.width, 7);

            ctx.fillStyle = "#39ff14";
            ctx.fillRect(
                enemy.x,
                enemy.y - 18,
                enemy.width * (enemy.health / 15),
                7
            );
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Arial";
            ctx.fillText("!", enemy.x + 11, enemy.y + 18);
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(item => {
        ctx.shadowBlur = 15;

        if (item.type === "app") {
            ctx.fillStyle = "#39ff14";
            ctx.shadowColor = "#39ff14";
            ctx.fillRect(item.x, item.y, item.width, item.height);

            ctx.fillStyle = "#020602";
            ctx.font = "bold 20px Arial";
            ctx.fillText("A", item.x + 10, item.y + 24);
        } else {
            ctx.fillStyle = "#00ccff";
            ctx.shadowColor = "#00ccff";
            ctx.fillRect(item.x, item.y, item.width, item.height);

            ctx.fillStyle = "#020602";
            ctx.font = "bold 20px Arial";
            ctx.fillText("K", item.x + 10, item.y + 24);
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

    enemyBullets.forEach(bullet => {
        ctx.fillStyle = "#ff3333";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x, bullet.y, 7, 13);
        ctx.shadowBlur = 0;
    });
}

function shoot() {
    const now = Date.now();
    const delay = rapidFire > 0 ? 180 : 350;

    if (now - lastShot < delay) return;

    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        speed: 8
    });

    lastShot = now;
}

function activateMFAPulse() {
    if (!mfaActive) {
        powerupStatus.textContent =
            "MFA IS NOT ACTIVE! Collect your second factor first.";
        return;
    }

    if (pulseCooldown > 0) {
        powerupStatus.textContent =
            "MFA verification pulse is recharging!";
        return;
    }

    mfaPulse = 100;
    pulseCooldown = 450;

    powerupStatus.textContent =
        "MFA VERIFICATION PULSE ACTIVATED!";
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

    enemyBullets.forEach(bullet => {
        bullet.y += bullet.speed;
    });

    bullets = bullets.filter(bullet => bullet.y > -20);

    enemyBullets = enemyBullets.filter(
        bullet => bullet.y < canvas.height + 20
    );
}

function enemyShoot(enemy) {
    const now = Date.now();

    if (now - enemy.lastAttack < (enemy.boss ? 1100 : 2400)) {
        return;
    }

    enemyBullets.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height,
        speed: enemy.boss ? 3.5 : 2.5
    });

    enemy.lastAttack = now;
}

function loseLife() {
    if (shield > 0 || mfaPulse > 0) return;

    if (mfaActive && mfaCharges > 0) {
        mfaCharges--;

        powerupStatus.textContent =
            "MFA BLOCKED AN ATTACK! " +
            mfaCharges +
            " DEFENSES REMAINING.";

        updateStats();
        return;
    }

    lives--;
    updateStats();

    powerupStatus.textContent =
        "PASSWORD-ONLY DEFENSE FAILED!";

    if (lives <= 0) {
        endGame(false);
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.boss) {
            if (enemy.y < 45) {
                enemy.y += enemy.speed;
            } else {
                enemy.x += enemy.direction * 1.1;

                if (
                    enemy.x <= 0 ||
                    enemy.x + enemy.width >= canvas.width
                ) {
                    enemy.direction *= -1;
                }
            }
        } else {
            enemy.y += enemy.speed;
        }

        enemyShoot(enemy);

        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
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

function updateCollectibles() {
    collectibles.forEach(item => {
        item.y += item.speed;

        if (
            item.x < player.x + player.width &&
            item.x + item.width > player.x &&
            item.y < player.y + player.height &&
            item.y + item.height > player.y
        ) {
            if (item.type === "app") {
                hasAuthenticator = true;
            } else {
                hasSecurityKey = true;
            }

            item.collected = true;

            mfaActive = true;
            mfaCharges = 3;
            defense = 100;

            score += 100;

            powerupStatus.textContent =
                "SECOND FACTOR VERIFIED! MFA IS NOW ACTIVE!";

            updateStats();
        }

        if (item.y > canvas.height && !item.collected) {
            item.y = -50;
            item.x = 40 + Math.random() * (canvas.width - 80);
        }
    });

    collectibles = collectibles.filter(
        item => !item.collected
    );
}

function checkCollisions() {
    bullets.forEach(bullet => {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 13 > enemy.y
            ) {
                if (enemy.boss && !mfaActive) {
                    bullet.y = -100;

                    powerupStatus.textContent =
                        "BOSS BLOCKED YOUR ATTACK! ACTIVATE MFA FIRST!";

                    break;
                }

                enemy.health--;
                bullet.y = -100;

                if (enemy.health <= 0) {
                    enemy.y = canvas.height + 100;
                    score += enemy.boss ? 500 : 20;
                    updateStats();
                }

                break;
            }
        }
    });

    enemyBullets.forEach(bullet => {
        if (
            bullet.x < player.x + player.width &&
            bullet.x + 7 > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + 13 > player.y
        ) {
            bullet.y = canvas.height + 100;
            loseLife();
        }
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
    updateCollectibles();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawCollectibles();

    if (shield > 0) shield--;
    if (rapidFire > 0) rapidFire--;
    if (mfaPulse > 0) mfaPulse--;
    if (pulseCooldown > 0) pulseCooldown--;

    if (lives <= 0) return;

    if (enemies.length === 0 && mfaActive) {
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
        "MFA SECURITY CHECKPOINT " + wave;

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
            "CORRECT! MFA KNOWLEDGE VERIFIED. DEFENSE UPGRADED!";

        feedback.style.color = "#39ff14";

        score += 100;
        mfaCharges = Math.min(mfaCharges + 1, 5);

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

        powerupStatus.textContent = "MFA DEFENSE UPGRADED!";
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

    spawnWave();

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

    const title = document.getElementById("endTitle");
    const message = document.getElementById("endMessage");

    if (won) {
        if (title) title.textContent = "MFA DEFENSE COMPLETE!";

        if (message) {
            message.textContent =
                "You defeated the hackers, verified your identity with MFA in every wave, and protected your account! Final score: " + score;
        }
    } else {
        if (title) title.textContent = "SECURITY BREACH!";

        if (message) {
            message.textContent =
                "Your defenses were overwhelmed. Remember: a password alone is not enough. Activate MFA and try again!";
        }
    }
}

document.addEventListener("keydown", event => {
    keys[event.key] = true;

    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key)
    ) {
        event.preventDefault();
    }

    if (event.key === "e" || event.key === "E") {
        activateMFAPulse();
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
