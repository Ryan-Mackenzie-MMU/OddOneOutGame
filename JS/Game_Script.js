// ---------- PLAYERS ----------

// Get players from Host_Lobby_Script.js
const storedPlayers = localStorage.getItem("gamePlayers");

let players;

if (storedPlayers) {
    players = JSON.parse(storedPlayers); // Use lobby players
} 
else 
{
    // fallback if someone opens Game.html directly
}

// ---------- GAME DATA ----------

let themes = [["Sport", 0], ["Food", 1], ["Games", 2], ["Films", 3], ["Celebrities", 4], ["Music", 5]];

let words = [
    ["Football", "Basketball", "Cricket", "Tennis", "Swimming"],
    ["Pizza", "Curry", "Steak", "Fish", "Cake"],
    ["Minecraft", "Fortnite", "Clash Royale", "GTA V"],
    ["Titanic", "Frozen", "Inception", "Avatar"],
    ["Taylor Swift", "The Rock", "Ronaldo", "Beyonce"],
    ["Pop", "Rock", "Jazz", "Rap"]
];

let randomTheme;
let themeIndex;
let secretWord;
let impostorIndex;

let currentPlayer = 0;
let hintPlayer = 0;
let votePlayer = 0;
let votes;
let hints = [];

// ---------- HELPERS ----------

function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ---------- SETUP GAME ----------

function setupGame() {
    randomTheme = random(themes);
    themeIndex = randomTheme[1];
    secretWord = random(words[themeIndex]);
    impostorIndex = Math.floor(Math.random() * players.length);

    votes = new Array(players.length).fill(0);
    hints = [];

    currentPlayer = 0;
    hintPlayer = 0;
    votePlayer = 0;

    document.getElementById("phaseTitle").innerText = "Role Reveal Phase";
    document.getElementById("playerTurn").innerText = players[currentPlayer];

    // Reset phases
    document.getElementById("roleReveal").classList.remove("hidden");
    document.getElementById("roleText").classList.add("hidden");
    document.getElementById("nextButton").classList.add("hidden");
    document.getElementById("hintPhase").classList.add("hidden");
    document.getElementById("votingPhase").classList.add("hidden");
    document.getElementById("resultPhase").classList.add("hidden");

    // Clear previous hints display
    const existingHints = document.getElementById("hintsContainer");
    if (existingHints) existingHints.remove();
}

setupGame();

// ---------- ROLE REVEAL ----------

function revealRole() {
    document.getElementById("roleReveal").classList.add("hidden");
    document.getElementById("roleText").classList.remove("hidden");
    document.getElementById("nextButton").classList.remove("hidden");

    if (currentPlayer === impostorIndex) 
    {
        document.getElementById("roleText").innerHTML = "<h2>You are the IMPOSTOR</h2><p>Theme: " + randomTheme[0] + "</p>";
    }
    else 
    {
        document.getElementById("roleText").innerHTML = "<h2>Secret Word: " + secretWord + "</h2><p>Theme: " + randomTheme[0] + "</p>";
    }
}

function nextPlayer() {
    currentPlayer++;

    document.getElementById("roleText").classList.add("hidden");
    document.getElementById("nextButton").classList.add("hidden");

    if (currentPlayer < players.length) 
    {
        document.getElementById("playerTurn").innerText = players[currentPlayer];
        document.getElementById("roleReveal").classList.remove("hidden");
    } 
    else 
    {
        startHintPhase();
    }
}

// ---------- HINT PHASE ----------

function startHintPhase() {
    document.getElementById("phaseTitle").innerText = "Hint Phase (Theme: " + randomTheme[0] + ")";
    document.getElementById("playerTurn").innerText = players[hintPlayer];
    document.getElementById("hintPhase").classList.remove("hidden");
}

// Impostor hint handling
function handleHintSubmission(hintText) {
    if (hintPlayer === impostorIndex) 
    {
        alert("You are the impostor — try to blend in 😈");
    }

    hints.push({
        player: players[hintPlayer],
        hint: hintText
    });
}

// Capture hint form submission
document.getElementById("hintForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const hintInput = document.getElementById("hint");
    const hintText = hintInput.value.trim();

    if (hintText === "")
    {
        alert("Please enter a hint!");
        return;
    }

    handleHintSubmission(hintText);
    hintInput.value = "";
    nextHint();
});

function nextHint() {
    hintPlayer++;

    if (hintPlayer < players.length) 
    {
        document.getElementById("playerTurn").innerText = players[hintPlayer];
    } 
    else 
    {
        startVotingPhase();
    }
}

// ---------- DISPLAY HINTS ----------

function displayHints() {
    const voteContainer = document.getElementById("voteButtons");

    // Remove old hints container
    const existingHints = document.getElementById("hintsContainer");
    if (existingHints) existingHints.remove();

    const hintsDiv = document.createElement("div");
    hintsDiv.id = "hintsContainer";
    hintsDiv.style.marginBottom = "15px";

    hints.forEach(h => {
        const p = document.createElement("p");
        p.innerText = h.player + ": " + h.hint;
        hintsDiv.appendChild(p);
    });

    voteContainer.parentNode.insertBefore(hintsDiv, voteContainer);
}

// ---------- VOTING PHASE ----------

function startVotingPhase() {
    document.getElementById("phaseTitle").innerText = "Voting Phase";
    document.getElementById("hintPhase").classList.add("hidden");
    document.getElementById("votingPhase").classList.remove("hidden");

    votePlayer = 0;

    // Show all hints
    displayHints();

    updateVotingUI();
}

// Prevent self-voting
function updateVotingUI() {
    document.getElementById("playerTurn").innerText = players[votePlayer] + " - Cast your vote";

    const voteContainer = document.getElementById("voteButtons");
    voteContainer.innerHTML = "";

    players.forEach((player, index) => {
        if (index === votePlayer) return; // Skip self

        const btn = document.createElement("button");
        btn.innerText = player;
        btn.onclick = function() { castVote(index); };
        voteContainer.appendChild(btn);
    });
}

function castVote(index) {
    votes[index]++;
    votePlayer++;

    if (votePlayer < players.length) 
    {
        updateVotingUI();
    } 
    else 
    {
        document.getElementById("votingPhase").classList.add("hidden");
        showResults();
    }
}

// ---------- RESULT PHASE ----------

function showResults() {
    let impostor = players[impostorIndex];

    document.getElementById("resultPhase").classList.remove("hidden");

    const highestVotes = Math.max(...votes);
    const tied = [];

    votes.forEach((vote, index) => {
        if (vote === highestVotes) tied.push(index);
    });

    if (tied.length > 1) 
    {
        document.getElementById("resultText").innerHTML = "It's a tie! No one was eliminated.<br>The Impostor was " + impostor;
        return;
    }

    const votedOut = tied[0];

    if (votedOut === impostorIndex) 
    {
        document.getElementById("resultText").innerHTML = players[votedOut] + " WAS the Impostor!";
    } 
    else 
    {
        document.getElementById("resultText").innerHTML = players[votedOut] + " was NOT the Impostor!<br>The Impostor was " + impostor;
    }
}

// ---------- RESTART ----------

function restartGame() {
    setupGame();
}