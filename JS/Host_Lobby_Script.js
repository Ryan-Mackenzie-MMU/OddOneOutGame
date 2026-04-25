const publicBtn = document.getElementById("PublicBt");
const privateBtn = document.getElementById("PrivateBt");

publicBtn.addEventListener("click", () => {
    publicBtn.classList.add("chosen");
    publicBtn.classList.remove("notChosen");

    privateBtn.classList.add("notChosen");
    privateBtn.classList.remove("chosen");
});

privateBtn.addEventListener("click", () => {
    privateBtn.classList.add("chosen");
    privateBtn.classList.remove("notChosen");

    publicBtn.classList.add("notChosen");
    publicBtn.classList.remove("chosen");
});


// =============================
// STATE
// =============================
let roomId = null;
let gameCode = null;

let hostUserId = null;
let hostUsername = null;


// =============================
// DOM
// =============================
const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayer");
const playersJoinedDiv = document.getElementById("playersJoined");
const startGameBtn = document.getElementById("startGame-button");


// =============================
// LOCK UI
// =============================
function lockHostInput() {
    playerInput.disabled = true;
    addPlayerBtn.style.display = "none";
}


// =============================
// CREATE ROOM (NO LOCK HERE)
// =============================
async function createRoom() {
    try {

        const res = await fetch("http://localhost:3000/create-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        roomId = data.roomId;
        gameCode = data.gameCode;

        document.getElementById("gameCode").textContent = gameCode;

        console.log("Room created:", roomId, gameCode);

        loadPlayers();

    } catch (err) {
        console.error("Error creating room:", err);
    }
}


// =============================
// LOAD PLAYERS
// =============================
async function loadPlayers() {
    if (!roomId) return;

    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`, {
            cache: "no-store"
        });

        const players = await res.json();

        playersJoinedDiv.innerHTML = "";

        players.forEach((p, i) => {
            const div = document.createElement("div");
            div.textContent = p.username;
            playersJoinedDiv.appendChild(div);

            if (i < players.length - 1) {
                playersJoinedDiv.appendChild(document.createElement("hr"));
            }
        });

    } catch (err) {
        console.error("Error loading players:", err);
    }
}


// =============================
// ADD PLAYER (ONLY HERE LOCKS)
// =============================
addPlayerBtn.addEventListener("click", async () => {

    const newPlayer = playerInput.value.trim();

    if (!newPlayer) {
        alert("Please enter a name!");
        return;
    }

    if (!roomId) {
        alert("Room not created yet!");
        return;
    }

    const userRes = await fetch("http://localhost:3000/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newPlayer })
    });

    const userData = await userRes.json();

    await fetch("http://localhost:3000/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            roomId,
            userId: userData.userId
        })
    });

    hostUserId = userData.userId;
    hostUsername = newPlayer;

    playerInput.value = "";

    loadPlayers();

    // ✅ LOCK ONLY AFTER CLICK
    lockHostInput();
});


// =============================
// START GAME
// =============================
startGameBtn.addEventListener("click", async () => {

    const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
    const players = await res.json();

    if (!Array.isArray(players) || players.length < 3) {
        alert("Need at least 3 players to start");
        return;
    }

    await fetch(`http://localhost:3000/start-game/${roomId}`, {
        method: "POST"
    });

    location.href =
        `../HTML/Game.html?roomId=${roomId}&userId=${hostUserId}&username=${encodeURIComponent(hostUsername)}`;
});


// =============================
// INIT
// =============================
createRoom();

setInterval(loadPlayers, 1000);