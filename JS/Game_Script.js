// =============================
// SESSION DATA
// =============================
const userId = localStorage.getItem("userId");
const roomId = localStorage.getItem("roomId");
const username = localStorage.getItem("username");

if (!userId || !roomId) {
    alert("Missing session data");
    throw new Error("No session found");
}


// =============================
// GAME STATE (FROM SERVER)
// =============================
let myRole = null;
let secretWord = null;


// =============================
// GAME DATA (UNCHANGED)
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

let players = [];
let randomTheme;
let themeIndex;

let currentPlayer = 0;
let hintPlayer = 0;
let votePlayer = 0;
let votes = [];
let hints = [];


// =============================
// RANDOM HELPER
// =============================
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}


// =============================
// LOAD MY ROLE (IMPORTANT FIX)
// =============================
async function loadMyRole() {
    const res = await fetch(`http://localhost:3000/my-role/${roomId}/${userId}`);
    const data = await res.json();

    console.log("ROLE DATA:", data);

    if (!data) {
        alert("No role found");
        return;
    }

    myRole = data.role;
    secretWord = data.secret_word;

    startGame();
}


// =============================
// LOAD PLAYERS (OPTIONAL for gameplay flow)
// =============================
async function loadPlayers() {
    const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
    const data = await res.json();

    players = data.map(p => p.username);

    console.log("PLAYERS:", players);
}


// =============================
// GAME SETUP
// =============================
function startGame() {

    randomTheme = random(themes);
    themeIndex = randomTheme[1];

    votes = new Array(players.length).fill(0);
    hints = [];

    currentPlayer = 0;
    hintPlayer = 0;
    votePlayer = 0;

    document.getElementById("phaseTitle").innerText = "Role Reveal Phase";
    document.getElementById("playerTurn").innerText = username;

    document.getElementById("roleReveal").classList.remove("hidden");
    document.getElementById("roleText").classList.add("hidden");
    document.getElementById("nextButton").classList.add("hidden");
    document.getElementById("hintPhase").classList.add("hidden");
    document.getElementById("votingPhase").classList.add("hidden");
    document.getElementById("resultPhase").classList.add("hidden");
}


// =============================
// ROLE REVEAL (FIXED to DB system)
// =============================
function revealRole() {

    document.getElementById("roleReveal").classList.add("hidden");
    document.getElementById("roleText").classList.remove("hidden");
    document.getElementById("nextButton").classList.remove("hidden");

    if (myRole === "impostor") {
        document.getElementById("roleText").innerHTML =
            `<h2>You are the IMPOSTOR 😈</h2>`;
    } else {
        document.getElementById("roleText").innerHTML =
            `<h2>Your Word: ${secretWord}</h2>`;
    }
}


// =============================
// INIT GAME FLOW
// =============================
(async function init() {
    await loadPlayers();
    await loadMyRole();
})();