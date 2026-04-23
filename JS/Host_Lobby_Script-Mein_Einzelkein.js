// -----------------------------
// Public / Private toggle
// -----------------------------
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


// -----------------------------
// Room (TEMP - will replace later with game code)
// -----------------------------
let roomId = null;
let gameCode = null;

async function createRoom() {
    const res = await fetch("http://localhost:3000/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    roomId = data.roomId;
    gameCode = data.gameCode;

    // show code in UI
    document.getElementById("gameCode").textContent = gameCode;

    loadPlayers();
}

createRoom();


// -----------------------------
// DOM elements
// -----------------------------
const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayer");
const playersJoinedDiv = document.getElementById("playersJoined");


// -----------------------------
// Load players from database
// -----------------------------
async function loadPlayers() {
    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
        const players = await res.json();

        playersJoinedDiv.innerHTML = "";

        players.forEach((player, index) => {
            const div = document.createElement("div");
            div.textContent = player.username;
            playersJoinedDiv.appendChild(div);

            if (index < players.length - 1) {
                const hr = document.createElement("hr");
                playersJoinedDiv.appendChild(hr);
            }
        });

    } catch (err) {
        console.error("Error loading players:", err);
    }
}


// -----------------------------
// Add player (REAL BACKEND)
// -----------------------------
addPlayerBtn.addEventListener("click", async () => {
    const newPlayer = playerInput.value.trim();

    if (newPlayer === "") {
        alert("Please enter a name!");
        return;
    }

    try {
        // 1️⃣ Create user
        const userRes = await fetch("http://localhost:3000/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: newPlayer })
        });

        if (!userRes.ok) throw new Error("Failed to create user");

        const userData = await userRes.json();

        // 2️⃣ Join room
        const joinRes = await fetch("http://localhost:3000/join-room", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomId: roomId,
                userId: userData.userId
            })
        });

        if (!joinRes.ok) throw new Error("Failed to join room");

        playerInput.value = "";

        // 3️⃣ Reload players from DB
        loadPlayers();

    } catch (err) {
        console.error("Error adding player:", err);
        alert("Failed to add player. Check server.");
    }
});


// -----------------------------
// Start game
// -----------------------------
document.getElementById("startGame-button").addEventListener("click", async () => {
    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
        const players = await res.json();

        if (players.length < 3) {
            alert("Less than 3 players in game lobby - cannot start game");
            return;
        }

        // Save usernames locally for now
        const playerNames = players.map(p => p.username);
        localStorage.setItem("gamePlayers", JSON.stringify(playerNames));

        location.href = '../HTML/Game.html';

    } catch (err) {
        console.error(err);
    }
});


// -----------------------------
// Initial load
// -----------------------------
loadPlayers();