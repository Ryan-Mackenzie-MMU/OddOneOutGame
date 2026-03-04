let themes = [["Sport", 0], ["Food", 1], ["Games", 2], ["Films", 3], ["Celebrities", 4], ["Music", 5]];
let words = [
    ["Football", "Basketball", "Cricket", "Tennis", "Swimming"],
    ["Pizza", "Curry", "Steak", "Fish", "Cake"],
    ["Minecraft", "Fortnite", "Clash Royale", "GTA V"],
    ["Titanic", "Frozen", "Inception", "Avatar"],
    ["Taylor Swift", "The Rock", "Ronaldo", "Beyonce"],
    ["Pop", "Rock", "Jazz", "Rap"]
];

let players = ["Player 1", "Player 2", "Player 3", "Player 4"];

// ---------- GAME VARIABLES ----------

let randomTheme;
let themeIndex;
let secretWord;
let impostorIndex;

let currentPlayer = 0;
let hintPlayer = 0;
let votePlayer = 0;
let votes;
let hints = []; // <-- NEW: store player hints

// ---------- HELPER ----------

function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ---------- GAME SETUP ----------

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
}

setupGame();

// ---------- ROLE REVEAL ----------

function revealRole() {
    document.getElementById("roleReveal").classList.add("hidden");
    document.getElementById("roleText").classList.remove("hidden");
    document.getElementById("nextButton").classList.remove("hidden");

    if (currentPlayer === impostorIndex) {
        document.getElementById("roleText").innerHTML =
            "<h2>You are the IMPOSTOR</h2><p>Theme: " + randomTheme[0] + "</p>";
    } else {
        document.getElementById("roleText").innerHTML =
            "<h2>Secret Word: " + secretWord + "</h2><p>Theme: " + randomTheme[0] + "</p>";
    }
}

function nextPlayer() {
    currentPlayer++;

    document.getElementById("roleText").classList.add("hidden");
    document.getElementById("nextButton").classList.add("hidden");

    if (currentPlayer < players.length) {
        document.getElementById("playerTurn").innerText = players[currentPlayer];
        document.getElementById("roleReveal").classList.remove("hidden");
    } else {
        startHintPhase();
    }
}

// ---------- HINT PHASE ----------

function startHintPhase() {
    document.getElementById("phaseTitle").innerText =
        "Hint Phase (Theme: " + randomTheme[0] + ")";
    document.getElementById("playerTurn").innerText = players[hintPlayer];
    document.getElementById("hintPhase").classList.remove("hidden");
}

// CAPTURE TEXTBOX VALUE
document.getElementById("hintForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let hintInput = document.getElementById("hint");
    let hintText = hintInput.value.trim();

    if (hintText === "") {
        alert("Please enter a hint!");
        return;
    }

    hints.push({
        player: players[hintPlayer],
        hint: hintText
    });

    hintInput.value = ""; // clear box
    nextHint();
});

function nextHint() {
    hintPlayer++;

    if (hintPlayer < players.length) {
        document.getElementById("playerTurn").innerText = players[hintPlayer];
    } else {
        startVotingPhase();
    }
}

// ---------- VOTING PHASE ----------

function startVotingPhase() {
    document.getElementById("phaseTitle").innerText = "Voting Phase";
    document.getElementById("hintPhase").classList.add("hidden");
    document.getElementById("votingPhase").classList.remove("hidden");
    votePlayer = 0;
    updateVotingUI();
}

function updateVotingUI() {
    document.getElementById("playerTurn").innerText =
        players[votePlayer] + " - Cast your vote";

    let voteContainer = document.getElementById("voteButtons");
    voteContainer.innerHTML = "";

    players.forEach((player, index) => {
        let btn = document.createElement("button");
        btn.innerText = player;
        btn.onclick = function() { castVote(index); };
        voteContainer.appendChild(btn);
    });
}

function castVote(index) {
    votes[index]++;
    votePlayer++;

    if (votePlayer < players.length) {
        updateVotingUI();
    } else {
        document.getElementById("votingPhase").classList.add("hidden");
        showResults();
    }
}

// ---------- RESULT PHASE ----------

function showResults() {
    document.getElementById("resultPhase").classList.remove("hidden");

    let highestVotes = Math.max(...votes);
    let tied = [];

    votes.forEach((vote, index) => {
        if (vote === highestVotes) tied.push(index);
    });

    if (tied.length > 1) {
        document.getElementById("resultText").innerHTML =
            "It's a tie! No one was eliminated.<br>The Impostor was " +
            players[impostorIndex];
        return;
    }

    let votedOut = tied[0];

    if (votedOut === impostorIndex) {
        document.getElementById("resultText").innerHTML =
            players[votedOut] + " WAS the Impostor! 🎉";
    } else {
        document.getElementById("resultText").innerHTML =
            players[votedOut] + " was NOT the Impostor!<br>The Impostor was " +
            players[impostorIndex];
    }
}

// ---------- RESTART ----------

function restartGame() {
    document.getElementById("resultPhase").classList.add("hidden");
    document.getElementById("roleReveal").classList.remove("hidden");
    document.getElementById("votingPhase").classList.add("hidden");
    document.getElementById("hintPhase").classList.add("hidden");

    setupGame();
}