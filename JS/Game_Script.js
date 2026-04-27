// =============================
// URL PARAMS
// =============================
const params = new URLSearchParams(window.location.search);

const userId = params.get("userId");
const roomId = params.get("roomId");
const username = params.get("username");

console.log("USER:", userId, "ROOM:", roomId);

if (!userId || !roomId) {
    alert("Missing session data");
    throw new Error("No session found");
}

// =============================
// STATE
// =============================
let myRole = null;
let secretWord = null;
let themeIndex = null;

let gameStarted = false;
let roleShown = false;

// =============================
// LOCAL DISPLAY DATA
// =============================
const themes = [
    "Sport",
    "Food",
    "Games",
    "Films",
    "Celebrities",
    "Music"
];

// =============================
// DOM REFERENCES
// =============================
const phaseTitle = document.getElementById("phaseTitle");
const playerTurn = document.getElementById("playerTurn");
const roleReveal = document.getElementById("roleReveal");

const hintPhase = document.getElementById("hintPhase");
const hintForm = document.getElementById("hintForm");
const hintInput = document.getElementById("hint");

// =============================
// LOAD GAME DATA
// =============================
async function loadGameData() {
    try {
        const res = await fetch(
            `https://oddoneoutgame.onrender.com/game-data/${roomId}/${userId}`,
            { cache: "no-store" }
        );

        const data = await res.json();

        if (!data) return false;

        themeIndex = data.theme_index;
        myRole = data.role;
        secretWord = data.secret_word;

        return true;

    } catch (err) {
        console.error(err);
        return false;
    }
}

// =============================
// SHOW ROLE SCREEN
// =============================
function showRoleScreen() {

    if (roleShown) return;
    roleShown = true;

    const isImpostor = myRole === "impostor";
    const themeName = themes[themeIndex] || "Unknown Theme";

    phaseTitle.textContent = "Your Role";
    playerTurn.textContent = username;

    roleReveal.innerHTML = `
        <h2>${isImpostor ? "You are the IMPOSTOR 😈" : "You are a CIVILIAN 👤"}</h2>
        ${isImpostor
            ? `<p>You have no word. Blend in!</p>`
            : `<p><strong>Your Word:</strong> ${secretWord}</p>`
        }
        <h3>Theme: ${themeName}</h3>
        <p>Game starting...</p>
    `;

    setTimeout(() => startGame(themeName), 3000);
}

// =============================
// START GAME
// =============================
function startGame(themeName) {

    const isImpostor = myRole === "impostor";

    phaseTitle.textContent = "Game Started";
    playerTurn.textContent = `Theme: ${themeName}`;

    roleReveal.innerHTML = isImpostor
        ? `<p>You are the IMPOSTOR 😈</p><p>Blend in and guess!</p>`
        : `<p>Give a hint for your word: <strong>${secretWord}</strong></p>`;

    hintPhase.classList.remove("hidden");
}

// =============================
// SUBMIT HINT
// =============================
hintForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hint = hintInput.value.trim();
    if (!hint) return alert("Enter a hint");

    await fetch("https://oddoneoutgame.onrender.com/submit-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, hint })
    });

    hintInput.disabled = true;
    hintForm.querySelector("button").disabled = true;

    playerTurn.textContent = "Waiting for other players...";

    const interval = setInterval(async () => {
        const done = await checkHintsComplete();
        if (done) clearInterval(interval);
    }, 1000);
});

// =============================
// CHECK HINTS
// =============================
async function checkHintsComplete() {

    const res = await fetch(`https://oddoneoutgame.onrender.com/hints/${roomId}`);
    const data = await res.json();

    const submitted = data.filter(p => p.hint && p.hint.trim() !== "").length;

    if (submitted === data.length) {
        showAllHints(data);
        return true;
    }

    return false;
}

// =============================
// SHOW HINTS + VOTING
// =============================
function showAllHints(players) {

    hintPhase.classList.add("hidden");

    phaseTitle.textContent = "All Hints";
    playerTurn.textContent = "Vote for the impostor";

    roleReveal.innerHTML = players.map(p => `
        <p><strong>${p.username}:</strong> ${p.hint}</p>
    `).join("");

    showVoting(players);
}

// =============================
// VOTING UI
// =============================
function showVoting(players) {

    roleReveal.innerHTML += `
        <h3>Vote:</h3>
        ${players.map(p => `
            <button onclick="submitVote(${p.user_id})">
                ${p.username}
            </button>
        `).join("<br>")}
    `;
}

// =============================
// SUBMIT VOTE
// =============================
async function submitVote(voteFor) {

    await fetch("https://oddoneoutgame.onrender.com/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, voteFor })
    });

    playerTurn.textContent = "Waiting for votes...";

    const interval = setInterval(async () => {
        const done = await checkVotesComplete();
        if (done) clearInterval(interval);
    }, 1000);
}

// =============================
// CHECK VOTES
// =============================
async function checkVotesComplete() {

    const res = await fetch(`https://oddoneoutgame.onrender.com/votes/${roomId}`);
    const data = await res.json();

    const submitted = data.filter(v => v.vote_for !== null).length;

    if (submitted === data.length) {
        showResults();
        return true;
    }

    return false;
}

// =============================
// RESULTS (UPDATED FOR NAMES)
// =============================
async function showResults() {

    const res = await fetch(`https://oddoneoutgame.onrender.com/results/${roomId}`);
    const data = await res.json();

    phaseTitle.textContent = "Results";

    roleReveal.innerHTML = `
        <p><strong>Voted Out:</strong> ${data.votedOutName}</p>
        <p><strong>Impostor:</strong> ${data.impostorName}</p>

        <h2>${data.civiliansWin ? "Civilians Win 🎉" : "Impostor Wins 😈"}</h2>

        <div style="margin-top:20px;">
            <button onclick="goToLobby()">Back to Lobby</button>
        </div>
    `;
}

async function goToLobby() {

    await fetch(`https://oddoneoutgame.onrender.com/clear-room-users/${roomId}`, {
        method: "POST"
    });

    window.location.href = "Choose_Lobby_Type.html";
}

// async function restartGame() {

//     try {
//         // request restart
//         await fetch(`http://localhost:3000/restart-game/${roomId}`, {
//             method: "POST"
//         });

//         // 2. reset frontend ONLY
//         gameStarted = false;
//         roleShown = false;
//         myRole = null;
//         secretWord = null;
//         themeIndex = null;

//         phaseTitle.textContent = "Restarting...";
//         roleReveal.innerHTML = "Waiting for players...";

//         hintInput.disabled = false;
//         hintInput.value = "";
//         hintForm.querySelector("button").disabled = false;

//     } catch (err) {
//         console.error(err);
//     }
// }

// =============================
// POLLING START
// =============================
setInterval(async () => {

    try {
        const res = await fetch(`https://oddoneoutgame.onrender.com/room-game/${roomId}`);
        const game = await res.json();

        if (!game) return;

        // =============================
        // RESTART SYNC
        // =============================
        // if (game.restart_flag === 1) {

        //     console.log("RESTART DETECTED");

        //     // Reset frontend state FIRST
        //     gameStarted = false;
        //     roleShown = false;
        //     myRole = null;
        //     secretWord = null;
        //     themeIndex = null;

        //     // Reset UI
        //     phaseTitle.textContent = "Restarting...";
        //     roleReveal.innerHTML = "Waiting for new game...";

        //     hintInput.disabled = false;
        //     hintInput.value = "";
        //     hintForm.querySelector("button").disabled = false;

        //     try {
        //         // Only ONE trigger needed (safe even if multiple clients call)
        //         await fetch(`http://localhost:3000/force-start/${roomId}`, {
        //             method: "POST"
        //         });
        //     } catch (err) {
        //         console.error("Force start failed:", err);
        //     }

        //     return; // stop loop here
        // }

        // =============================
        // NORMAL GAME START FLOW
        // =============================
        if (gameStarted) return;

        if (game.started !== 1) return;

        const ok = await loadGameData();
        if (!ok) return;

        gameStarted = true;
        showRoleScreen();

    } catch (err) {
        console.error(err);
    }

}, 1000);

// =============================
console.log("Game waiting for start...");