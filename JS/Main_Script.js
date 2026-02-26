const titleWords = [
    "oddWord",
    "oneWord",
    "outWord"
];

// Cache elements once
const elements = titleWords.map(id => document.getElementById(id));

let titleIndex = 0;

// Initial state
elements.forEach(el => el.classList.add("blackWord"));
elements[0].classList.remove("blackWord");
elements[0].classList.add("whiteWord");

function changeTitleColour() {

    // Turn current black
    elements[titleIndex].classList.remove("whiteWord");
    elements[titleIndex].classList.add("blackWord");

    // Move to next index
    titleIndex++;

    // Reset if at end
    if (titleIndex >= elements.length) {
        titleIndex = 0;
    }

    // Turn new current white
    elements[titleIndex].classList.remove("blackWord");
    elements[titleIndex].classList.add("whiteWord");
}

setInterval(changeTitleColour, 1000);