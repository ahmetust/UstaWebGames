let selectedCards = [];
let hintUsed = false;
let characterDataMap = new Map();
let mistakeCount = 0;
let currentGameMode = 'normal'; // Default mod olarak normal yapıldı
const MAX_MISTAKES = 5;
const START_SCORE = 25;
const PENALTY = 5;
const MAX_TIME = 180; // 3 dakika
const MAX_BONUS = 30;
let gameStartTime = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newgame-btn").addEventListener("click", resetGame);
  document.getElementById("confirm-btn").addEventListener("click", handleConfirm);
  document.getElementById("hint-btn").addEventListener("click", useHint);
  
  // Mod seçimi event listener'ları ekle
  const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
  difficultyRadios.forEach(radio => {
    radio.addEventListener('change', handleDifficultyChange);
  });
  
  clearAndCustomizeConsole();
  resetGame();
});

function handleDifficultyChange(event) {
  currentGameMode = event.target.value;
  updateModeIndicator();
  
  // Oyun devam ediyorsa uyarı göster
  const visibleCards = document.querySelectorAll("#group-container .card");
  if (visibleCards.length > 0 && visibleCards.length < 16) {
    Swal.fire({
      icon: 'question',
      title: 'Mode Changed',
      text: 'The game is still ongoing. Do you want to start a new game?',
      showCancelButton: true,
      confirmButtonText: 'Yes, New game',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        resetGame();
      }
    });
  } else {
    // Oyun devam etmiyorsa direkt yeni oyun başlat
    resetGame();
  }
}

function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    let modeText;
    switch(currentGameMode) {
      case 'easy':
        modeText = 'Easy Mode';
        break;
      case 'normal':
        modeText = 'Normal Mode';
        break;
      case 'hard':
        modeText = 'Hard Mode';
        break;
      default:
        modeText = 'Normal Mode';
    }
    modeIndicator.textContent = modeText;
    modeIndicator.className = `mode-indicator ${currentGameMode}`;
  }
}

function updateCharacterCount(count) {
  const characterCount = document.getElementById('character-count');
  if (characterCount) {
    characterCount.textContent = `${count} karakter havuzundan`;
  }
}

function resetGame() {
  mistakeCount = 0;
  updateHearts();
  hintUsed = false;
  selectedCards = [];
  gameStartTime = Date.now();
  updateModeIndicator();
  loadCharacters();
  updateHintButtonState();
}

function updateHintButtonState() {
  document.getElementById("hint-btn").disabled = hintUsed;
}

function useHint() {
  if (hintUsed) return;

  const visibleCards = Array.from(document.querySelectorAll("#group-container .card"));
  const visibleNames = visibleCards.map(card => card.dataset.name);

  const groupToVisibleNames = {};
  visibleNames.forEach(name => {
    const info = characterDataMap.get(name);
    if (!info) return;
    if (!groupToVisibleNames[info.groupInfo]) groupToVisibleNames[info.groupInfo] = [];
    groupToVisibleNames[info.groupInfo].push(name);
  });

  const availableGroups = Object.entries(groupToVisibleNames).filter(([_, names]) => names.length >= 2);

  const [groupKey, names] = availableGroups[Math.floor(Math.random() * availableGroups.length)];

  selectedCards = [];
  document.querySelectorAll(".card.selected").forEach(card => card.classList.remove("selected"));

  const [first, second] = names;

  selectedCards.push(first, second);
  visibleCards.forEach(card => {
    if (card.dataset.name === first || card.dataset.name === second) {
      card.classList.add("selected");
    }
  });

  updateConfirmButtonState();
  hintUsed = true;
  updateHintButtonState();
}

function updateHearts() {
  const container = document.getElementById('hearts-container');
  container.innerHTML = '';
  for (let i = 0; i < MAX_MISTAKES; i++) {
    const heart = document.createElement('span');
    heart.textContent = i < (MAX_MISTAKES - mistakeCount) ? '❤️' : '🤍';
    heart.style.fontSize = '2rem';
    heart.style.margin = '0 2px';
    container.appendChild(heart);
  }
}

function clearAndCustomizeConsole() {
  console.clear();
  const originalLog = console.log;
  console.log = function (...args) {
    if (typeof args[0] === "string" && args[0].startsWith("True Answer:")) {
      originalLog(...args);
    }
  };
  console.error = console.warn = console.info = console.debug = () => {};
}

function updateConfirmButtonState() {
  document.getElementById("confirm-btn").disabled = selectedCards.length !== 4;
}

function handleCardClick(card) {
  const name = card.dataset.name;

  if (selectedCards.includes(name)) {
    selectedCards = selectedCards.filter(n => n !== name);
    card.classList.remove("selected");
  } else {
    if (selectedCards.length >= 4) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'You can select up to 4 cards!',
        showConfirmButton: false,
        timer: 1200
      }); 
      return;
    }
    selectedCards.push(name);
    card.classList.add("selected");
  }
  updateConfirmButtonState();
}

async function loadCharacters() {
  hintUsed = false;
  document.getElementById("hint-btn").disabled = true;
  
  try {
    // Seçili moda göre API çağrısı yap
    const response = await fetch(`/api/generate-groups?mode=${currentGameMode}&logOnly=final`);
    const data = await response.json();

    // Mod ve karakter sayısı bilgilerini güncelle
    updateModeIndicator();
    updateCharacterCount(data.totalCharacters);

    const container = document.getElementById("group-container");
    const matchedContainer = document.getElementById("matched-groups");
    container.innerHTML = "";
    matchedContainer.innerHTML = "";
    
    selectedCards = [];
    characterDataMap.clear();
    updateConfirmButtonState();

    const allCharacters = Object.values(data.groups).flatMap(group =>
      group.characters.map(character => {
        characterDataMap.set(character.Name, {
          groupInfo: `${group.feature}:${group.value}`,
          imageUrl: character.Resimler,
          difficulty: group.difficulty
        });
        return character;
      })
    );

    // Kartları karıştır
    for (let i = allCharacters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCharacters[i], allCharacters[j]] = [allCharacters[j], allCharacters[i]];
    }

    // Kartları oluştur
    for (const character of allCharacters) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.name = character.Name;

      const box = document.createElement("div");
      box.className = "box";

      const img = document.createElement("img");
      img.src = character.Resimler;
      img.alt = character.Name;
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });

      box.appendChild(img);
      card.appendChild(box);

      const name = document.createElement("p");
      name.textContent = character.Name;
      card.appendChild(name);

      container.appendChild(card);
      card.addEventListener("click", () => handleCardClick(card));
    }
    updateHintButtonState();
  } catch (err) {
    console.error('Error while loading characters:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while loading characters. Please try again.',
      confirmButtonText: 'OK'
    });
  }
}

function getAllAnswersHTML() {
  const groups = {};
  characterDataMap.forEach((value, name) => {
    if (!groups[value.groupInfo]) groups[value.groupInfo] = [];
    groups[value.groupInfo].push({ name, imageUrl: value.imageUrl });
  });

  let html = '';
  for (const group in groups) {
    const [feature, value] = group.split(":");
    html += `<div style="margin-bottom:1em;">
      <div style="font-weight:bold; margin-bottom:0.25em;">✔ ${feature} = ${value}</div>
      <div class="answers-row">`;
    for (const item of groups[group]) {
      html += `<div class="card-answers">
        <div class="card-img">
          <img src="${item.imageUrl}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <span class="card-name" title="${item.name}">${item.name}</span>
      </div>`;
    }
    html += `</div></div>`;
  }
  return html;
}

function showAllAnswers() {
  const matchedContainer = document.getElementById("matched-groups");
  matchedContainer.innerHTML = '';

  const groups = {};
  characterDataMap.forEach((value, name) => {
    if (!groups[value.groupInfo]) groups[value.groupInfo] = [];
    groups[value.groupInfo].push({ name, imageUrl: value.imageUrl });
  });

  for (const group in groups) {
    const [feature, value] = group.split(":");
    const matchDiv = document.createElement("div");
    matchDiv.className = "matched-group";
    const infoDiv = document.createElement("div");
    infoDiv.className = "feature-info";
    infoDiv.textContent = `✔ ${feature} = ${value}`;
    const cardsDiv = document.createElement("div");
    cardsDiv.className = "matched-cards";
    for (const item of groups[group]) {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      const box = document.createElement("div");
      box.className = "box";
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = item.name;
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });
      box.appendChild(img);
      cardDiv.appendChild(box);
      const nameText = document.createElement("p");
      nameText.textContent = item.name;
      cardDiv.appendChild(nameText);
      cardsDiv.appendChild(cardDiv);
    }
    matchDiv.appendChild(infoDiv);
    matchDiv.appendChild(cardsDiv);
    matchedContainer.appendChild(matchDiv);
  }
}

function oyunBitirVePuaniGoster(kaybettiMi = false) {
  if (kaybettiMi) {
    return;
  }
  const gameEndTime = Date.now();
  const elapsedSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);

  let timeBonus = Math.max(0, MAX_BONUS - Math.floor((elapsedSeconds / MAX_TIME) * MAX_BONUS));

  let score = START_SCORE - (mistakeCount * PENALTY) + timeBonus;
  if (score < 0) score = 0;

  let modeText;
  switch(currentGameMode) {
    case 'easy':
      modeText = 'Easy Mode';
      break;
    case 'normal':
      modeText = 'Normal Mode';
      break;
    case 'hard':
      modeText = 'Hard Mode';
      break;
    default:
      modeText = 'Normal Mod';
  }

  Swal.fire({
    icon: 'success',
    title: 'Congratulations! You Finished the Game! 🎉',
    html: `
      <div style="text-align: center; margin: 1rem 0;">
        <p><strong>Mode:</strong> ${modeText}</p>
        <p><strong>Your Score:</strong> ${score}</p>
        <p><strong>Time:</strong> ${elapsedSeconds} seconds</p>
        <p><strong>Number of Mistakes:</strong> ${mistakeCount}</p>
      </div>
    `,
    confirmButtonText: 'New Game'
  }).then(() => {
    resetGame();
  });
}


function handleConfirm() {
  const groupValues = selectedCards.map(name => characterDataMap.get(name).groupInfo);
  const isMatch = groupValues.every(group => group === groupValues[0]);

  if (isMatch) {
    const container = document.getElementById("group-container");
    const matchedContainer = document.getElementById("matched-groups");
    const groupInfo = groupValues[0];
    const firstColonIndex = groupInfo.indexOf(":");
    const feature = groupInfo.substring(0, firstColonIndex);
    const value = groupInfo.substring(firstColonIndex + 1);
    const difficulty = characterDataMap.get(selectedCards[0]).difficulty;

    console.log(`TRUE ANSWER: ${selectedCards.map((n, i) => `${i + 1}. ${n}`).join(", ")} - ${feature}: ${value}`);

    const matchDiv = document.createElement("div");
    matchDiv.className = "matched-group";

    const infoDiv = document.createElement("div");
    infoDiv.className = "feature-info";
    infoDiv.textContent = `✔ ${feature} = ${value} (Tag Difficulty: ${difficulty})`;

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "matched-cards";

    for (const name of selectedCards) {
      const { imageUrl } = characterDataMap.get(name);
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";

      const box = document.createElement("div");
      box.className = "box";

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = name;
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });

      box.appendChild(img);
      cardDiv.appendChild(box);

      const nameText = document.createElement("p");
      nameText.textContent = name;
      cardDiv.appendChild(nameText);

      cardsDiv.appendChild(cardDiv);
    }

    matchDiv.appendChild(infoDiv);
    matchDiv.appendChild(cardsDiv);
    matchedContainer.appendChild(matchDiv);

    container.querySelectorAll(".card").forEach(card => {
      if (selectedCards.includes(card.dataset.name)) {
        card.remove();
      }
    });

    selectedCards = [];
    updateConfirmButtonState();

    Swal.fire({
      icon: 'success',
      title: 'Congratulations!',
      text: 'You found the correct group 🎉',
      showConfirmButton: false,
      timer: 1200
    });

    if (container.querySelectorAll(".card").length === 0) {
      oyunBitirVePuaniGoster();
    }
    return;
  }

  mistakeCount++;
  updateHearts();
  if (mistakeCount >= MAX_MISTAKES) {
    const answersHTML = getAllAnswersHTML();
    let modeText;
    switch(currentGameMode) {
      case 'easy':
        modeText = 'Easy Mode';
        break;
      case 'normal':
        modeText = 'Normal Mode';
        break;
      case 'hard':
        modeText = 'Hard Mode';
        break;
      default:
        modeText = 'Normal Mode';
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Game Over',
      html: `
        <div style="margin-bottom: 1rem;">
          <p><strong>Mode:</strong> ${modeText}</p>
          <p>You made 5 mistakes. All answers are shown below.</p>
        </div>
        <div style="max-height:350px; overflow:auto; margin-bottom:1em;">
          ${answersHTML}
        </div>
      `,
      confirmButtonText: 'Restart',
      width: '650px'
    }).then(() => {
      resetGame();
    });
    return;
  }

  const groupCountMap = {};
  for (const group of groupValues) {
    groupCountMap[group] = (groupCountMap[group] || 0) + 1;
  }

  const groupEntries = Object.entries(groupCountMap);
  if (groupEntries.length === 2 && groupEntries.some(([_, count]) => count === 3)) {
    Swal.fire({
      icon: 'error',
      title: 'Wrong Guess',
      text: 'You selected 3 cards from the same group but 1 card from a different group',
      showConfirmButton: false,
      timer: 1200
    });
    return;
  }

  Swal.fire({
    icon: 'error',
    title: 'Wrong Guess',
    text: 'Incorrect grouping',
    showConfirmButton: false,
    timer: 1200
  });
}
