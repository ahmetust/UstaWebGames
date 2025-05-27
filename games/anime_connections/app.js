let selectedCards = [];
let hintUsed = false;
let characterDataMap = new Map();
let mistakeCount = 0;
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
  clearAndCustomizeConsole();
  resetGame();
});



function resetGame() {
  mistakeCount = 0;
  updateHearts();
  hintUsed = false;
  selectedCards = [];
  gameStartTime = Date.now();
  loadCharacters();
  updateHintButtonState(); // <-- burada çağır (veya loadCharacters sonunda)
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
    if (!info) return; // güvenlik!
    if (!groupToVisibleNames[info.groupInfo]) groupToVisibleNames[info.groupInfo] = [];
    groupToVisibleNames[info.groupInfo].push(name);
  });

  // Ekranda en az 2 üyesi kalan grupları bul
  const availableGroups = Object.entries(groupToVisibleNames).filter(([_, names]) => names.length >= 2);

  if (availableGroups.length === 0) {
    Swal.fire({
      icon: "info",
      title: "İpucu Yok",
      text: "İpucu verilecek grup kalmadı!",
      timer: 1800,
      showConfirmButton: false
    });
    return;
  }

  // Rastgele bir uygun grup seç
  const [groupKey, names] = availableGroups[Math.floor(Math.random() * availableGroups.length)];

  // Önce mevcut seçimi temizle
  selectedCards = [];
  document.querySelectorAll(".card.selected").forEach(card => card.classList.remove("selected"));

  // Seçilecek 2 karakter
  const [first, second] = names;

  // Seçili kartlara ekle ve görselde seçili yap
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
    if (typeof args[0] === "string" && args[0].startsWith("DOĞRU CEVAP:")) {
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
        title: 'Uyarı',
        text: 'En fazla 4 kart seçebilirsiniz!',
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
    const response = await fetch("/api/generate-groups?logOnly=final");
    const data = await response.json();

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
          difficulty: group.difficulty // Buradan!
        });
        return character;
      })
    );

    for (let i = allCharacters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCharacters[i], allCharacters[j]] = [allCharacters[j], allCharacters[i]];
    }

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
  } catch (err) {}
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
  // Tüm grupları ve karakterleri göster
  // characterDataMap ve data.groups üzerinden dönebilirsin
  // Örnek basit bir gösterim:
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
    // Artık burada hiçbir bildirim gösterilmesin!!
    return;
  }
  const gameEndTime = Date.now();
  const elapsedSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);

  // Hız bonusu
  let timeBonus = Math.max(0, MAX_BONUS - Math.floor((elapsedSeconds / MAX_TIME) * MAX_BONUS));

  // Puan hesabı
  let score = START_SCORE - (mistakeCount * PENALTY) + timeBonus;
  if (score < 0) score = 0;

  Swal.fire({
    icon: 'info',
    title: 'Oyun Bitti!',
    html: `<b>Puanınız:</b> ${score} <br><b>Süreniz:</b> ${elapsedSeconds} sn`,
    confirmButtonText: 'Tamam'
  }).then(() => {
    resetGame();
  });
}


function handleConfirm() {

  const groupValues = selectedCards.map(name => characterDataMap.get(name).groupInfo);
  const isMatch = groupValues.every(group => group === groupValues[0]);

  if (isMatch) {
    // Mevcut doğru eşleşme kodu burada çalışmaya devam edecek
    const container = document.getElementById("group-container");
    const matchedContainer = document.getElementById("matched-groups");
    const groupInfo = groupValues[0];
    const firstColonIndex = groupInfo.indexOf(":");
    const feature = groupInfo.substring(0, firstColonIndex);
    const value = groupInfo.substring(firstColonIndex + 1);
    const difficulty = characterDataMap.get(selectedCards[0]).difficulty;

    console.log(`DOĞRU CEVAP: ${selectedCards.map((n, i) => `${i + 1}. ${n}`).join(", ")} - ${feature}: ${value}`);

    const matchDiv = document.createElement("div");
    matchDiv.className = "matched-group";

    const infoDiv = document.createElement("div");
    infoDiv.className = "feature-info";
    infoDiv.textContent = `✔ ${feature} = ${value} (Zorluk: ${difficulty})`;

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
      title: 'Tebrikler!',
      text: 'Doğru grubu buldunuz 🎉',
      showConfirmButton: false,
      timer: 1200
    });

    if (container.querySelectorAll(".card").length === 0) {
      oyunBitirVePuaniGoster();
    }
    return;
  }

  // Yanlış tahminler için:
  mistakeCount++;
  updateHearts();
  if (mistakeCount >= MAX_MISTAKES) {
    // YALNIZCA cevaplar ve yeni oyun butonu olan Swal göster, başka puan/süre bildirimine gerek yok!
    const answersHTML = getAllAnswersHTML();
    Swal.fire({
      icon: 'error',
      title: 'Oyun Bitti',
      html: `
        <div style="max-height:350px; overflow:auto; margin-bottom:1em;">
          ${answersHTML}
        </div>
        <div>5 hata yaptınız. Tüm cevaplar yukarıda gösteriliyor.</div>
      `,
      confirmButtonText: 'Yeniden Başla',
      width: '650px'
    }).then(() => {
      resetGame(); // Sadece oyunu sıfırla!
    });
    return;
  }

  // 3'ü aynı, 1'i farklı gruplandırma
  const groupCountMap = {};
  for (const group of groupValues) {
    groupCountMap[group] = (groupCountMap[group] || 0) + 1;
  }

  const groupEntries = Object.entries(groupCountMap);
  if (groupEntries.length === 2 && groupEntries.some(([_, count]) => count === 3)) {
    Swal.fire({
      icon: 'error',
      title: 'Yanlış Tahmin',
      text: 'Seçtiğiniz 3 kart aynı gruptan fakat 1 kart farklı gruptan',
      showConfirmButton: false,
      timer: 1200
    });
    return;
  }

  // Yanlış Gruplandırma
      Swal.fire({
      icon: 'error',
      title: 'Yanlış Tahmin',
      text: 'Yanlış gruplandırma',
      showConfirmButton: false,
      timer: 1200
    });
}
