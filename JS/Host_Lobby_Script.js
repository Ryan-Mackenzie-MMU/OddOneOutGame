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
// Room state
// -----------------------------
let roomId = null; 
let gameCode = null; 

// -----------------------------
// DOM elements
// -----------------------------
const playerInput = document.getElementById("playerName"); 
const addPlayerBtn = document.getElementById("addPlayer"); 
const playersJoinedDiv = document.getElementById("playersJoined"); 

// -----------------------------
// Lock host UI (ONLY AFTER JOIN)
// -----------------------------
function lockHostInput() { 
    playerInput.disabled = true; 
    addPlayerBtn.style.display = "none"; 
} 

// -----------------------------
// Create room on page load
// -----------------------------
async function createRoom() { 
    try { 
        // 1️⃣ Create room
        const res = await fetch("http://localhost:3000/create-room", { 
            method: "POST", 
            headers: { 
                "Content-Type": "application/json" 
            } 
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

// -----------------------------
// Load players from DB
// -----------------------------
async function loadPlayers() { 
    if (!roomId) return; 

    try { 
        const res = await fetch(`http://localhost:3000/room-players/${roomId}`); 
        const players = await res.json(); 

        playersJoinedDiv.innerHTML = ""; 

        console.log("RAW RESPONSE:", players);

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

// -----------------------------
// Add player (HOST ONLY)
// -----------------------------
addPlayerBtn.addEventListener("click", async () => { 
    const newPlayer = playerInput.value.trim(); 

    if (newPlayer === "") { 
        alert("Please enter a name!"); 
        return; 
    } 

    if (!roomId) { 
        alert("Room not created yet!"); 
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

        const userData = await userRes.json(); 

        // 2️⃣ Join room
        await fetch("http://localhost:3000/join-room", { 
            method: "POST", 
            headers: { 
                "Content-Type": "application/json" 
            }, 
            body: JSON.stringify({ 
                roomId: roomId, 
                userId: userData.userId 
            }) 
        }); 

        playerInput.value = ""; 

        loadPlayers(); 

        // ⭐ NOW LOCK (ONLY AFTER SUCCESS)
        lockHostInput(); 

    } catch (err) { 
        console.error("Error adding player:", err); 
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

        const playerNames = players.map(p => p.username); 
        localStorage.setItem("gamePlayers", JSON.stringify(playerNames)); 

        location.href = '../HTML/Game.html'; 

    } catch (err) { 
        console.error("Error starting game:", err); 
    } 
}); 

// -----------------------------
// INIT
// -----------------------------
createRoom(); 

// 🔁 auto-refresh lobby every 1 second
setInterval(() => { 
    loadPlayers(); 
}, 1000);