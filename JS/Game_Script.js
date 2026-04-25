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
// LOAD FULL GAME DATA (NEW SERVER ENDPOINT)
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

        // ✅ FROM RoomGame
        themeIndex = data.theme_index;

        // ✅ FROM RoomPlayers
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

    const box = document.querySelector(".game-box");

    box.innerHTML = `
        <h1>Your Role</h1>
        <h2>${username}</h2>

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
    }, 40000);
}

// =============================
// START GAME PHASE
// =============================
function startGame(themeName) {

    const box = document.querySelector(".game-box");

    box.innerHTML = `
        <h1>Game Started</h1>
        <h2>Theme: ${themeName}</h2>
        <p>Discuss and find the impostor!</p>
    `;

    console.log("Game started:", themeName);
}

// =============================
// POLLING LOOP (SIMPLIFIED + FIXED)
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