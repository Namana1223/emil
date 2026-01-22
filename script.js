// Game Configuration and State
const modal = document.getElementById('game-modal');
const closeBtn = document.querySelector('.close-btn');
const gameArea = document.getElementById('game-area');

// Close Modal
closeBtn.onclick = () => {
    modal.style.display = 'none';
    gameArea.innerHTML = '';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
        gameArea.innerHTML = '';
    }
};

// Game Router
function openGame(gameType) {
    modal.style.display = 'flex';
    gameArea.innerHTML = '';

    switch (gameType) {
        case 'runner':
            initRunnerGame();
            break;
        case 'puzzle':
            initPuzzleGame();
            break;
        case 'memory':
            initMemoryGame();
            break;
    }
}

// --- GAME 1: CURSA OSTAŞULUI (Runner) ---
function initRunnerGame() {
    gameArea.innerHTML = `
        <div class="runner-container">
            <div class="score">Apa salvată: <span id="runner-score">0</span>L</div>
            <canvas id="runnerCanvas"></canvas>
            <div class="instructions">Sari peste stânci și văpăi (SPACE/CLICK)!</div>
        </div>
    `;

    const canvas = document.getElementById('runnerCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 760;
    canvas.height = 400;

    let score = 0;
    let gameActive = true;
    let speed = 5;

    const player = {
        x: 50, y: 350, w: 40, h: 40, dy: 0,
        jumpForce: 12, gravity: 0.6, grounded: false
    };

    const obstacles = [];

    function spawnObstacle() {
        if (!gameActive) return;
        const types = ['rock', 'fire'];
        const type = types[Math.floor(Math.random() * types.length)];
        obstacles.push({
            x: canvas.width,
            y: 350,
            w: 30 + Math.random() * 20,
            h: 30 + Math.random() * 30,
            type: type
        });
        setTimeout(spawnObstacle, 1500 + Math.random() * 1500);
    }

    function update() {
        if (!gameActive) return;

        player.dy += player.gravity;
        player.y += player.dy;

        if (player.y > 350) {
            player.y = 350;
            player.dy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= speed;

            if (player.x < obstacles[i].x + obstacles[i].w &&
                player.x + player.w > obstacles[i].x &&
                player.y < obstacles[i].y + obstacles[i].h &&
                player.y + player.h > obstacles[i].y) {
                gameOver();
            }

            if (obstacles[i].x + obstacles[i].w < 0) {
                obstacles.splice(i, 1);
                score += 10;
                document.getElementById('runner-score').innerText = score;
                if (score % 100 === 0) speed += 0.5;
            }
        }

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ground (Poem: "Cerul persan" background)
        ctx.fillStyle = '#E6C229';
        ctx.fillRect(0, 390, canvas.width, 10);

        // Player (Soldier with Helmet)
        ctx.fillStyle = '#1A2F4B';
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillStyle = '#00f'; // Water in helmet
        ctx.fillRect(player.x + 5, player.y - 10, 30, 10);

        obstacles.forEach(obs => {
            if (obs.type === 'rock') {
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + obs.h);
                ctx.lineTo(obs.x + obs.w / 2, obs.y);
                ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                ctx.fill();
            } else {
                ctx.fillStyle = '#ff4500'; // Fire/Văpaie
                ctx.fillRect(obs.x, obs.y + 10, obs.w, obs.h - 10);
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(obs.x + 5, obs.y + 15, obs.w - 10, obs.h - 20);
            }
        });
    }

    function gameOver() {
        gameActive = false;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('AI VĂRSAT COMOARA!', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Outfit';
        ctx.fillText('Click pentru a reîncerca', canvas.width / 2, canvas.height / 2 + 40);
    }

    function reset() {
        score = 0; speed = 6; obstacles.length = 0;
        gameActive = true;
        update();
        spawnObstacle();
    }

    window.onkeydown = (e) => {
        if (e.code === 'Space' && player.grounded) player.dy = -13;
    };
    canvas.onclick = () => {
        if (!gameActive) reset();
        else if (player.grounded) player.dy = -13;
    };

    reset();
}

// --- GAME 2: PUZZLE LIRIC ---
let currentStanza = 0;
const stanzas = [
    [
        "Sub cerul persan, Alexandru cel Mare",
        "umbla prin pustiu, pe sub streşini de stânci.",
        "Când iată: soldaţi aduceau de-a călare",
        "burdufuri cu apă din văile-adânci."
    ],
    [
        "Atunci, obosit şi setos, Alexandru",
        "întoarse privirea în jur prin deşert.",
        "Un soare imens, fioros policandru,",
        "rănea alburiul zenitului fiert,"
    ]
];

function initPuzzleGame() {
    renderPuzzleLevel();
}

function renderPuzzleLevel() {
    const lines = stanzas[currentStanza];
    let shuffled = [...lines].sort(() => Math.random() - 0.5);

    gameArea.innerHTML = `
        <div class="puzzle-container">
            <h3>Nivelul ${currentStanza + 1}: Ordonează strofa</h3>
            <ul id="sortable-lines">
                ${shuffled.map((line, i) => `
                    <li draggable="true" id="line-${i}">${line}</li>
                `).join('')}
            </ul>
            <button class="btn-play" onclick="checkPuzzle()">Verifică</button>
            <div id="puzzle-feedback"></div>
        </div>
    `;

    const list = document.getElementById('sortable-lines');
    let draggedItem = null;

    list.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        e.target.style.opacity = '0.5';
    });
    list.addEventListener('dragend', (e) => e.target.style.opacity = '1');
    list.addEventListener('dragover', (e) => e.preventDefault());
    list.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'LI' && e.target !== draggedItem) {
            const items = [...list.querySelectorAll('li')];
            const currIdx = items.indexOf(draggedItem);
            const targetIdx = items.indexOf(e.target);
            if (currIdx < targetIdx) list.insertBefore(draggedItem, e.target.nextSibling);
            else list.insertBefore(draggedItem, e.target);
        }
    });
}

window.checkPuzzle = () => {
    const correctOrder = stanzas[currentStanza];
    const currentOrder = [...document.querySelectorAll('#sortable-lines li')].map(li => li.innerText);
    const feedback = document.getElementById('puzzle-feedback');

    if (JSON.stringify(correctOrder) === JSON.stringify(currentOrder)) {
        if (currentStanza < stanzas.length - 1) {
            feedback.innerHTML = "✨ Bravo! Treci la următoarea strofă.";
            feedback.style.color = "blue";
            setTimeout(() => {
                currentStanza++;
                renderPuzzleLevel();
            }, 1000);
        } else {
            feedback.innerHTML = "🏆 Felicitări! Ai ordonat balada perfect.";
            feedback.style.color = "green";
        }
    } else {
        feedback.innerHTML = "❌ Mai încearcă, ordinea nu este corectă.";
        feedback.style.color = "red";
    }
};

// --- GAME 3: SIMBOLURILE PUSTIULUI (Memory) ---
function initMemoryGame() {
    const poemSymbols = [
        { sym: '🪖', name: 'Coiful' },
        { sym: '💧', name: 'Apa' },
        { sym: '☀️', name: 'Soarele' },
        { sym: '🏺', name: 'Burduful' },
        { sym: '🐎', name: 'Calul' },
        { sym: '⚔️', name: 'Sulița' },
        { sym: '🛡️', name: 'Scutul' },
        { sym: '🔥', name: 'Văpaia' }
    ];
    const cards = [...poemSymbols, ...poemSymbols].sort(() => Math.random() - 0.5);

    gameArea.innerHTML = `
        <div class="memory-container">
            <h3>Potrivește simbolurile din poezie</h3>
            <div class="memory-grid" id="memory-grid">
                ${cards.map((item, i) => `
                    <div class="memory-card" onclick="flipCard(this, '${item.sym}')" data-sym="${item.sym}">?</div>
                `).join('')}
            </div>
            <div id="memory-stats" style="margin-top: 1rem; color: #1A2F4B; font-weight: 600;"></div>
        </div>
    `;
}

let flippedCards = [];
let matchedPairs = 0;

window.flipCard = (card, sym) => {
    if (flippedCards.length === 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.innerText = sym;
    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        if (flippedCards[0].dataset.sym === flippedCards[1].dataset.sym) {
            flippedCards.forEach(c => c.classList.add('matched'));
            flippedCards = [];
            matchedPairs++;
            document.getElementById('memory-stats').innerText = `Perechi găsite: ${matchedPairs}/8`;
            if (matchedPairs === 8) {
                setTimeout(() => {
                    alert('Excelent! Ai o memorie demnă de un cuceritor!');
                    matchedPairs = 0;
                }, 500);
            }
        } else {
            setTimeout(() => {
                flippedCards.forEach(c => {
                    c.classList.remove('flipped');
                    c.innerText = '?';
                });
                flippedCards = [];
            }, 1000);
        }
    }
};

// --- GLOBAL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // Poem Toggle
    const toggleBtn = document.getElementById('toggle-poem-btn');
    const extraStanzas = document.getElementById('extra-stanzas');

    if (toggleBtn && extraStanzas) {
        toggleBtn.onclick = () => {
            const isShowing = extraStanzas.classList.toggle('show');
            toggleBtn.innerText = isShowing ? 'Citește mai puțin' : 'Citește mai mult';
            if (isShowing) extraStanzas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
    }
});

// Easter Eggs
document.getElementById('easter-egg-1').onclick = () => {
    alert("Ai găsit Coiful lui Alexandru! 'comoara din coif le-o dădu înapoi.'");
};

document.getElementById('easter-egg-2').onclick = () => {
    document.body.style.filter = "contrast(200%) brightness(80%) sepia(50%)";
    setTimeout(() => document.body.style.filter = "none", 1500);
};
