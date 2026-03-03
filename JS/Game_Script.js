let players = ["Player 1", "Player 2", "Player 3", "Player 4"];
let secretWord = "Pizza";
let impostorIndex = Math.floor(Math.random() * players.length);

let currentPlayer = 0;
let hintPlayer = 0;
let votes = new Array(players.length).fill(0);

// -------- ROLE REVEAL PHASE --------

function revealRole() {
    document.getElementById("roleReveal").classList.add("hidden");
    document.getElementById("roleText").classList.remove("hidden");
    document.getElementById("nextButton").classList.remove("hidden");

    if (currentPlayer === impostorIndex) {
        document.getElementById("roleText").innerHTML = "<h2>You are the IMPOSTOR</h2>";
    } else {
        document.getElementById("roleText").innerHTML = "<h2>Secret Word: " + secretWord + "</h2>";
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

// -------- HINT PHASE --------

function startHintPhase() {
    document.getElementById("phaseTitle").innerText = "Hint Phase";
    document.getElementById("playerTurn").innerText = players[hintPlayer];
    document.getElementById("hintPhase").classList.remove("hidden");
}

function nextHint() {
    hintPlayer++;
    if (hintPlayer < players.length) {
        document.getElementById("playerTurn").innerText = players[hintPlayer];
    } else {
        startVotingPhase();
    }
}

// -------- VOTING PHASE --------

function startVotingPhase() {
    document.getElementById("phaseTitle").innerText = "Voting Phase";
    document.getElementById("hintPhase").classList.add("hidden");
    document.getElementById("votingPhase").classList.remove("hidden");

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
    document.getElementById("votingPhase").classList.add("hidden");
    showResults();
}

// -------- RESULT PHASE --------

function showResults() {
    document.getElementById("resultPhase").classList.remove("hidden");

    let highestVotes = Math.max(...votes);
    let votedOut = votes.indexOf(highestVotes);

    if (votedOut === impostorIndex) {
        document.getElementById("resultText").innerHTML =
            players[votedOut] + " was the Impostor! They have been eliminated!";
    } else {
        document.getElementById("resultText").innerHTML =
            players[votedOut] + " was NOT the Impostor! The Impostor was " + players[impostorIndex];
    }
}

function restartGame() {
    location.reload();
}