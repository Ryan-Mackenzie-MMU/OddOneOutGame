// =============================
// URL PARAMS + SESSION
// =============================
const params = new URLSearchParams(window.location.search);

const userId = params.get("userId") || localStorage.getItem("userId");
const roomId = params.get("roomId") || localStorage.getItem("roomId");
const username = params.get("username") || localStorage.getItem("username");


console.log("URL userId:", params.get("userId"));
console.log("LOCAL userId:", localStorage.getItem("userId"));

localStorage.setItem("userId", userId);
localStorage.setItem("roomId", roomId);
localStorage.setItem("username", username);

if (!userId || !roomId) {
    alert("Missing session data");
    throw new Error("No session found");
}

// =============================
// STATE
// =============================
let myRole = null;
let secretWord = null;
let gameStarted = false;
let roleShown = false;

// =============================
// THEMES / WORDS
// =============================
let themes = [
    ["Sport", 0],
    ["Food", 1],
    ["Games", 2],
    ["Films", 3],
    ["Celebrities", 4],
    ["Music", 5]
];

let words = [
    ["Football", "Basketball", "Cricket", "Tennis", "Swimming"],
    ["Pizza", "Curry", "Steak", "Fish", "Cake"],
    ["Minecraft", "Fortnite", "Clash Royale", "GTA V"],
    ["Titanic", "Frozen", "Inception", "Avatar"],
    ["Taylor Swift", "The Rock", "Ronaldo", "Beyonce"],
    ["Pop", "Rock", "Jazz", "Rap"]
];

// =============================
// HELPERS
// =============================
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// =============================
// LOAD ROLE (STRICT + NO CACHE)
// =============================
async function loadMyRole() {
    try {
        const res = await fetch(
            `http://localhost:3000/my-role/${roomId}/${userId}`,
            { cache: "no-store" } // 🔥 prevent stale data
        );

        const data = await res.json();

        console.log("ROLE DATA:", data, "FOR USER:", userId);

        // 🔥 STRICT CHECK (fix race condition)
        if (!data || !data.role) {
            console.log("Role not ready yet...");
            return false;
        }

        myRole = data.role;
        secretWord = data.secret_word;

        return true;

    } catch (err) {
        console.error("Role error:", err);
        return false;
    }
}

// =============================
// SHOW ROLE SCREEN
// =============================
function showRoleScreen() {

    if (roleShown) return;
    roleShown = true;

    const isCivilian = (myRole !== "impostor");

    const box = document.querySelector(".game-box");

    box.innerHTML = `
        <h1>Your Role</h1>
        <h2>${username}</h2>

        <h2>
            ${isCivilian
                ? "You are a CIVILIAN 👤"
                : "You are the IMPOSTOR 😈"}
        </h2>

        ${
            isCivilian
                ? `<p>Your Word: ${secretWord}</p>`
                : `<p>You have no word. Blend in!</p>`
        }

        <p>Game starting...</p>
    `;

    setTimeout(() => {
        startGame();
    }, 5000); // (reduced from 500000 for sanity)
}

// =============================
// MAIN GAME START
// =============================
function startGame() {

    const theme = random(themes);

    const box = document.querySelector(".game-box");

    box.innerHTML = `
        <h1>Game Started</h1>
        <h2>Theme: ${theme[0]}</h2>
        <p>Continue gameplay here...</p>
    `;

    console.log("Game fully started");
}

// =============================
// SERVER POLLING (FIXED)
// =============================
setInterval(async () => {

    if (gameStarted) return;

    try {
        const res = await fetch(
            `http://localhost:3000/room/${roomId}`,
            { cache: "no-store" } // 🔥 prevent stale room state
        );

        if (!res.ok) return;

        const room = await res.json();

        console.log("ROOM:", room);

        if (!room || room.game_started !== 1) return;

        const ok = await loadMyRole();

        if (!ok) return;

        // 🔥 DOUBLE SAFETY CHECK
        if (!myRole) return;

        gameStarted = true;

        showRoleScreen();

    } catch (err) {
        console.error("Polling error:", err);
    }

}, 1000);

// =============================
// INIT
// =============================
(function init() {
    console.log("Game waiting for start...");
})();