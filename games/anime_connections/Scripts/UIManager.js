// UIManager.js - Kullanıcı arayüzü yönetimi
import { GAME_CONFIG, MODE_TEXTS } from './GameConfig.js';

export class UIManager {
  constructor() {
    this.elements = {
      groupContainer: () => document.getElementById("group-container"),
      matchedContainer: () => document.getElementById("matched-groups"),
      confirmBtn: () => document.getElementById("confirm-btn"),
      hintBtn: () => document.getElementById("hint-btn"),
      heartsContainer: () => document.getElementById('hearts-container'),
      modeIndicator: () => document.getElementById('mode-indicator'),
      characterCount: () => document.getElementById('character-count'),
      previewContainer: () => document.getElementById('character-preview'),
      togglePreviewBtn: () => document.getElementById('toggle-preview-btn')
    };
    this.isPreviewEnabled = true;
  }

  initPreviewToggler() {
    const toggleBtn = this.elements.togglePreviewBtn();
    const previewContainer = this.elements.previewContainer();
    const statusText = document.getElementById('preview-status-text');
    if (!toggleBtn || !previewContainer || !statusText) return;

    toggleBtn.addEventListener("click", () => {
      this.isPreviewEnabled = !this.isPreviewEnabled;
      if (this.isPreviewEnabled) {
        toggleBtn.innerHTML = `<i class="fas fa-eye"></i>`;
        statusText.textContent = "On";
        statusText.style.color = "#16a34a";
        // paneli temizle, hoverlarda tekrar açılabilsin
      } else {
        this.hideCharacterPreview(); // paneli tamamen kapat
        toggleBtn.innerHTML = `<i class="fas fa-eye-slash"></i>`;
        statusText.textContent = "Off";
        statusText.style.color = "#dc2626";
      }
    });
  }

 showCharacterPreview(character) {
    if (!this.isPreviewEnabled) return;
    const previewContainer = this.elements.previewContainer();
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div class="preview-content">
        <div class="preview-image">
          <img src="${character.Resimler}" alt="${character.Name}" />
        </div>
        <div class="preview-info">
          <h3>${character.Name}</h3>
        </div>
      </div>
    `;
    previewContainer.style.display = 'block';
  }

    // HOVER ÇIKINCA KAPATMAK — ama panel devre dışı ise zaten pasif
  hideCharacterPreview() {
    const previewContainer = this.elements.previewContainer();
    if (!previewContainer) return;
    if (!this.isPreviewEnabled) {
      previewContainer.style.display = 'none';
      return;
    }
    previewContainer.style.display = 'none';
  }

  updateModeIndicator(currentGameMode) {
    const modeIndicator = this.elements.modeIndicator();
    if (!modeIndicator) return;
    
    const modeText = MODE_TEXTS[currentGameMode] || MODE_TEXTS.normal;
    modeIndicator.textContent = modeText;
    modeIndicator.className = `mode-indicator ${currentGameMode}`;
  }

  updateCharacterCount(count) {
    const characterCount = this.elements.characterCount();
    if (characterCount) {
      characterCount.textContent = `${count} karakter havuzundan`;
    }
  }

  updateHearts(mistakeCount) {
    const container = this.elements.heartsContainer();
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < GAME_CONFIG.MAX_MISTAKES; i++) {
      const heart = document.createElement('span');
      heart.textContent = i < (GAME_CONFIG.MAX_MISTAKES - mistakeCount) ? '❤️' : '🤍';
      heart.style.fontSize = '2rem';
      heart.style.margin = '0 2px';
      container.appendChild(heart);
    }
  }

  updateConfirmButton(canConfirm) {
    const confirmBtn = this.elements.confirmBtn();
    if (confirmBtn) {
      confirmBtn.disabled = !canConfirm;
    }
  }

  updateHintButton(hintUsed) {
    const hintBtn = this.elements.hintBtn();
    if (hintBtn) {
      hintBtn.disabled = hintUsed;
    }
  }

  toggleCardSelection(card, isSelected) {
    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  }

  clearSelectedCards() {
    document.querySelectorAll(".card.selected").forEach(card => {
      card.classList.remove("selected");
    });
  }

  createCard(character) {
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

    // Hover olaylarını ekle
    card.addEventListener('mouseenter', () => {
      this.showCharacterPreview(character);
    });

    card.addEventListener('mouseleave', () => {
      this.hideCharacterPreview();
    });

    return card;
  }

  renderCards(characters, onCardClick) {
    const container = this.elements.groupContainer();
    const matchedContainer = this.elements.matchedContainer();
    
    if (container) container.innerHTML = "";
    if (matchedContainer) matchedContainer.innerHTML = "";

    characters.forEach(character => {
      const card = this.createCard(character);
      card.addEventListener("click", () => onCardClick(card));
      container?.appendChild(card);
    });
  }

  removeCards(selectedCards) {
    const container = this.elements.groupContainer();
    if (!container) return;
    
    container.querySelectorAll(".card").forEach(card => {
      if (selectedCards.includes(card.dataset.name)) {
        card.remove();
      }
    });
  }

  addMatchedGroup(selectedCards, groupInfo, characterDataMap) {
    const matchedContainer = this.elements.matchedContainer();
    if (!matchedContainer) return;

    const [feature, value] = groupInfo.split(":");
    const difficulty = characterDataMap.get(selectedCards[0])?.difficulty;

    const matchDiv = document.createElement("div");
    matchDiv.className = "matched-group";

    const infoDiv = document.createElement("div");
    infoDiv.className = "feature-info";
    infoDiv.textContent = `✔ ${feature} = ${value} (Tag Difficulty: ${difficulty})`;

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "matched-cards";

    selectedCards.forEach(name => {
      const data = characterDataMap.get(name);
      if (!data) return;
      
      const cardDiv = this.createCard({ Name: name, Resimler: data.imageUrl });
      cardsDiv.appendChild(cardDiv);
    });

    matchDiv.appendChild(infoDiv);
    matchDiv.appendChild(cardsDiv);
    matchedContainer.appendChild(matchDiv);
  }

  isGameComplete() {
    const container = this.elements.groupContainer();
    return container?.querySelectorAll(".card").length === 0;
  }

  getAllAnswersHTML(characterDataMap) {
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
}