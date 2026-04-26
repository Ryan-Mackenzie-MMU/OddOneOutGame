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
            `http://localhost:3000/game-data/${roomId}/${userId}`,
            { cache: "no-store" }
        );

        const data = await res.json();

        console.log("GAME DATA:", data);

        if (!data) return false;

        themeIndex = data.theme_index;
        myRole = data.role;
        secretWord = data.secret_word;

        return true;

    } catch (err) {
        console.error("Game data error:", err);
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
        <h2>
            ${isImpostor ? "You are the IMPOSTOR 😈" : "You are a CIVILIAN 👤"}
        </h2>

        ${
            isImpostor
                ? `<p>You have no word. Blend in!</p>`
                : `<p><strong>Your Word:</strong> ${secretWord}</p>`
        }

        <h3>Theme: ${themeName}</h3>
        <p>Game starting...</p>
    `;

    setTimeout(() => {
        startGame(themeName);
    }, 4000);
}

// =============================
// START GAME PHASE
// =============================
function startGame(themeName) {

    const isImpostor = myRole === "impostor";

    phaseTitle.textContent = "Game Started";
    playerTurn.textContent = `Theme: ${themeName}`;

    if (isImpostor) {
        roleReveal.innerHTML = `
            <p>You are the IMPOSTOR 😈</p>
            <p>Give it your best guess!</p>
        `;
    } else {
        roleReveal.innerHTML = `
            <p>Give a hint related to the word! ${secretWord}</p>
        `;
    }

    // SHOW hint input
    hintPhase.classList.remove("hidden");

    console.log("Game started:", themeName);
}

// =============================
// HINT SUBMISSION
// =============================
hintForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hint = hintInput.value.trim();

    if (!hint) {
        alert("Enter a hint");
        return;
    }

    console.log("HINT SUBMITTED:", hint);

    // 🚀 FUTURE: send to server here
    /*
    await fetch("http://localhost:3000/submit-hint", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            roomId,
            userId,
            hint
        })
    });
    */

    // Disable after submit
    hintInput.disabled = true;
    hintForm.querySelector("button").disabled = true;

    playerTurn.textContent = "Hint submitted!";
});

// =============================
// POLLING LOOP
// =============================
setInterval(async () => {

    if (gameStarted) return;

    try {
        const res = await fetch(
            `http://localhost:3000/room-game/${roomId}`,
            { cache: "no-store" }
        );

        const roomGame = await res.json();

        if (!roomGame || roomGame.started !== 1) return;

        const ok = await loadGameData();
        if (!ok) return;

        gameStarted = true;
        showRoleScreen();

    } catch (err) {
        console.error("Polling error:", err);
    }

}, 1000);

// =============================
// INIT
// =============================
console.log("Game waiting for start...");