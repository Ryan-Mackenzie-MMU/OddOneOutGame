// =============================
// DOM ELEMENTS
// =============================
const joinBtn = document.getElementById("joinLobby-button");
const playerInput = document.getElementById("playerName");
const roomCodeInput = document.getElementById("roomCode");

const joinContainer = document.getElementById("joinContainer");
const lobbyContainer = document.getElementById("lobbyContainer");
const playersJoinedDiv = document.getElementById("playersJoined");
const usernameDiv = document.getElementById("username");

// =============================
// STATE
// =============================
let roomId = null;
let userId = null;
let username = null;

let playerPoll = null;
let gamePoll = null;

// =============================
// LOAD PLAYERS
// =============================
async function loadPlayers() {
    if (!roomId) return;

    try {
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`);
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
        console.error("Load players error:", err);
    }
}

// =============================
// SHOW USERNAME
// =============================
function setUsername(name) {
    if (!usernameDiv) return;
    usernameDiv.textContent = name;
}

// =============================
// GAME START CHECK (FIXED)
// =============================
function startGameCheck() {

    if (gamePoll) clearInterval(gamePoll);

    gamePoll = setInterval(async () => {

        if (!roomId) return;

        try {
            const res = await fetch(`http://localhost:3000/room-game/${roomId}`);
            const roomGame = await res.json();

            // IMPORTANT: match DB column exactly
            if (!roomGame || roomGame.started !== 1) return;

            clearInterval(gamePoll);
            clearInterval(playerPoll);

            // go to game
            location.href =
                `../HTML/Game.html?roomId=${roomId}&userId=${userId}&username=${username}`;

        } catch (err) {
            console.error("Game polling error:", err);
        }

    }, 1500);
}

// =============================
// JOIN LOBBY (FIXED FLOW)
// =============================
joinBtn.addEventListener("click", async () => {

    username = playerInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();

    if (!username || !roomCode) {
        alert("Enter username and room code");
        return;
    }

    try {
        // 1. FIND ROOM
        const roomRes = await fetch(`http://localhost:3000/room-by-code/${roomCode}`);
        const room = await roomRes.json();

        if (!room || !room.id) {
            alert("Room not found");
            return;
        }

        roomId = room.id;

        // 2. CREATE USER
        const userRes = await fetch("http://localhost:3000/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const userData = await userRes.json();
        userId = userData.userId;

        if (!userId) {
            alert("User creation failed");
            return;
        }

        // 3. JOIN ROOM
        await fetch("http://localhost:3000/join-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, userId })
        });

        // 4. SAVE SESSION
        localStorage.setItem("userId", userId);
        localStorage.setItem("roomId", roomId);
        localStorage.setItem("username", username);

        // 5. SWITCH UI
        joinContainer.style.display = "none";
        lobbyContainer.style.display = "block";

        setUsername(username);

        // 6. INITIAL LOAD
        loadPlayers();

        playerPoll = setInterval(loadPlayers, 1500);

        // 7. WAIT FOR GAME START
        startGameCheck();

    } catch (err) {
        console.error("JOIN ERROR:", err);
        alert("Error joining lobby");
    }
});