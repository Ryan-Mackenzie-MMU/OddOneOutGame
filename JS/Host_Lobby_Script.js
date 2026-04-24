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
// Room state
// =============================
let roomId = null;
let gameCode = null;


// =============================
// DOM elements
// =============================
const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayer");
const playersJoinedDiv = document.getElementById("playersJoined");
const startGameBtn = document.getElementById("startGame-button");


// =============================
// Lock host UI
// =============================
function lockHostInput() {
    playerInput.disabled = true;
    addPlayerBtn.style.display = "none";
}


// =============================
// Create room
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
// Load players
// =============================
async function loadPlayers() {
    if (!roomId) return;

    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
        const players = await res.json();

        playersJoinedDiv.innerHTML = "";

        console.log("PLAYERS:", players);

        players.forEach((player, index) => {
            const div = document.createElement("div");
            div.textContent = player.username;
            playersJoinedDiv.appendChild(div);

            if (index < players.length - 1) {
                playersJoinedDiv.appendChild(document.createElement("hr"));
            }
        });

    } catch (err) {
        console.error("Error loading players:", err);
    }
}


// =============================
// Add player
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

    try {
        const userRes = await fetch("http://localhost:3000/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: newPlayer })
        });

        const userData = await userRes.json();

        // ✅ SAVE HOST SESSION
        localStorage.setItem("userId", userData.userId);
        localStorage.setItem("roomId", roomId);
        localStorage.setItem("username", newPlayer);

        await fetch("http://localhost:3000/join-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId,
                userId: userData.userId
            })
        });

        playerInput.value = "";

        loadPlayers();

        lockHostInput();

    } catch (err) {
        console.error("Error adding player:", err);
    }
});


// =============================
// START GAME (ONLY ONE HANDLER)
// =============================
document.getElementById("startGame-button").addEventListener("click", async () => {

    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
        const players = await res.json();

        if (!Array.isArray(players) || players.length < 1) {
            alert("Need at least 3 players to start");
            return;
        }

        // start game in DB
        await fetch(`http://localhost:3000/start-game/${roomId}`, {
            method: "POST"
        });

        // go to game (host also transitions)
        location.href = `../HTML/Game.html?roomId=${roomId}&userId=${localStorage.getItem("userId")}&username=${localStorage.getItem("username")}`;

    } catch (err) {
        console.error("Start game error:", err);
    }
});


// =============================
// INIT
// =============================
createRoom();

// auto refresh lobby
setInterval(() => {
    loadPlayers();
}, 1000);