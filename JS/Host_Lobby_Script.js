//Changes public/private button colour when clicked
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

// Add player functionality -----------------------------

// Array to keep track of players
let players = []; // initial players

// Get DOM elements
const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayer");
const playersJoinedDiv = document.getElementById("playersJoined");

// Function to update the displayed player list
function updatePlayersList() {
    // Clear current content
    playersJoinedDiv.innerHTML = "";

    // Loop through players and add them to the div
    players.forEach((player, index) => {
        const playerDiv = document.createElement("div");
        playerDiv.textContent = player;
        playersJoinedDiv.appendChild(playerDiv);

        // Add <hr> after each player except the last
        if (index < players.length - 1) {
            const hr = document.createElement("hr");
            playersJoinedDiv.appendChild(hr);
        }
    });
}

// Event listener for "Add Player" button
addPlayerBtn.addEventListener("click", () => {
    const newPlayer = playerInput.value.trim();

    if (newPlayer === "") {
        alert("Please enter a name!");
        return;
    }

    if (players.length >= 6) {
        alert("Lobby is full! Maximum of 6 players allowed.");
        return;
    }

    players.push(newPlayer);  // Add to array
    updatePlayersList();      // Refresh UI
    playerInput.value = "";   // Clear input
});

// Initial render
updatePlayersList();