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
let gameCheckInterval = null;

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
// START GAME CHECK (MATCH HOST STYLE)
// =============================
function startGameCheck() {

    if (gameCheckInterval) clearInterval(gameCheckInterval);

    gameCheckInterval = setInterval(async () => {

        if (!roomId) return;

        try {
            const res = await fetch(`http://localhost:3000/room/${roomId}`);
            const room = await res.json();

            if (room && room.game_started === 1) {

                // ✅ SAME AS HOST
                location.href = `../HTML/Game.html?roomId=${roomId}&userId=${userId}&username=${username}`;
            }

        } catch (err) {
            console.error("Polling error:", err);
        }

    }, 1500);
}

// =============================
// JOIN LOBBY (MATCH HOST FLOW)
// =============================
joinBtn.addEventListener("click", async () => {

    username = playerInput.value.trim(); // ✅ store globally
    const roomCode = roomCodeInput.value.trim().toUpperCase();

    if (!username || !roomCode) {
        alert("Enter username and room code");
        return;
    }

    try {
        // 1️⃣ GET ROOM
        const roomRes = await fetch(`http://localhost:3000/room-by-code/${roomCode}`);
        const room = await roomRes.json();

        if (!room || !room.id) {
            alert("Room not found");
            return;
        }

        roomId = room.id;

        // 2️⃣ CREATE USER
        const userRes = await fetch("http://localhost:3000/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const userData = await userRes.json();
        userId = userData.userId;

        // ✅ SAVE SESSION (same as host)
        localStorage.setItem("userId", userId);
        localStorage.setItem("roomId", roomId);
        localStorage.setItem("username", username);

        // 3️⃣ JOIN ROOM
        await fetch("http://localhost:3000/join-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId,
                userId
            })
        });

        // 4️⃣ SWITCH UI
        joinContainer.style.display = "none";
        lobbyContainer.style.display = "block";

        setUsername(username);

        // 5️⃣ LOAD PLAYERS
        loadPlayers();

        setInterval(() => {
            loadPlayers();
        }, 1500);

        // 6️⃣ START GAME POLLING
        startGameCheck();

    } catch (err) {
        console.error("JOIN ERROR:", err);
        alert("Error joining lobby");
    }
});