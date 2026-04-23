
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

let currentRoomId = null;
let currentUserId = null;


// =============================
// LOAD PLAYERS
// =============================
async function loadPlayers(roomId) {
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
// SHOW USERNAME IN LOBBY
// =============================
function setUsername(username) {
    if (!usernameDiv) return;
    usernameDiv.textContent = username;
}


// =============================
// JOIN LOBBY
// =============================
joinBtn.addEventListener("click", async () => {

    // ✅ ALWAYS TRIM INPUT HERE
    const username = playerInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();

    if (!username || !roomCode) {
        alert("Enter username and room code");
        return;
    }

    try {
        // 1️⃣ Get room
        const roomRes = await fetch(`http://localhost:3000/room-by-code/${roomCode}`);
        const room = await roomRes.json();

        if (!room || !room.id) {
            alert("Room not found");
            return;
        }

        currentRoomId = room.id;

        // 2️⃣ Create user
        const userRes = await fetch("http://localhost:3000/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const userData = await userRes.json();
        currentUserId = userData.userId;

        // 3️⃣ Join room
        await fetch("http://localhost:3000/join-room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId: room.id,
                userId: currentUserId
            })
        });

        // 4️⃣ SAVE DATA FOR GAME.JS
        localStorage.setItem("username", username);
        localStorage.setItem("roomId", room.id);
        localStorage.setItem("userId", currentUserId);

        // 5️⃣ SWITCH UI (stay in lobby)
        joinContainer.style.display = "none";
        lobbyContainer.style.display = "block";

        // 6️⃣ SHOW USERNAME
        setUsername(username);

        // 7️⃣ LOAD PLAYERS
        loadPlayers(room.id);

        // 8️⃣ LIVE UPDATES
        setInterval(() => {
            loadPlayers(room.id);
        }, 1500);

    } catch (err) {
        console.error("JOIN ERROR:", err);
        alert("Error joining lobby");
    }
});


// =============================
// SAFE UI SYNC (optional)
// =============================
setInterval(() => {
    const username = playerInput.value.trim();
    setUsername(username);
}, 500);