// main.js - Ana oyun dosyası
import { GameState } from './GameState.js';
import { UIManager } from './UIManager.js';
import { GameLogic } from './GameLogic.js';
import { NotificationManager } from './NotificationManager.js';

class Game {
  constructor() {
    this.state = new GameState();
    this.ui = new UIManager();
    this.setupConsole();
    this.initializeEventListeners();
    this.resetGame();
  }

  setupConsole() {
    console.clear();
    const originalLog = console.log;
    console.log = function (...args) {
      if (typeof args[0] === "string" && args[0].startsWith("True Answer:")) {
        originalLog(...args);
      }
    };
    console.error = console.warn = console.info = console.debug = () => {};
  }

  initializeEventListeners() {
    document.getElementById("newgame-btn")?.addEventListener("click", () => this.resetGame());
    document.getElementById("confirm-btn")?.addEventListener("click", () => this.handleConfirm());
    document.getElementById("hint-btn")?.addEventListener("click", () => this.useHint());
    
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    difficultyRadios.forEach(radio => {
      radio.addEventListener('change', (event) => this.handleDifficultyChange(event));
    });
  }

  async handleDifficultyChange(event) {
    this.state.currentGameMode = event.target.value;
    this.ui.updateModeIndicator(this.state.currentGameMode);
    
    const visibleCards = document.querySelectorAll("#group-container .card");
    const gameInProgress = visibleCards.length > 0 && visibleCards.length < 16;

    if (gameInProgress) {
      const shouldRestart = await NotificationManager.showModeChangeConfirmation();
      if (shouldRestart) {
        this.resetGame();
      }
    } else {
      this.resetGame();
    }
  }

  async resetGame() {
    this.state.reset();
    this.ui.updateHearts(this.state.mistakeCount);
    this.ui.updateModeIndicator(this.state.currentGameMode);
    this.ui.updateHintButton(this.state.hintUsed);
    this.ui.updateConfirmButton(this.state.canConfirm());
    await this.loadCharacters();
  }

  async loadCharacters() {
    this.ui.updateHintButton(true); // Disable hint while loading
    
    try {
      const { characters, characterDataMap, totalCharacters } = 
        await GameLogic.loadCharactersData(this.state.currentGameMode);
      
      this.state.characterDataMap = characterDataMap;
      this.ui.updateCharacterCount(totalCharacters);
      this.ui.renderCards(characters, (card) => this.handleCardClick(card));
      this.ui.updateHintButton(this.state.hintUsed);
      
    } catch (err) {
      console.error('Error while loading characters:', err);
      NotificationManager.showApiError();
    }
  }

  handleCardClick(card) {
    const name = card.dataset.name;
    const result = this.state.selectCard(name);

    if (!result.canSelect) {
      NotificationManager.showCardLimitWarning();
      return;
    }

    this.ui.toggleCardSelection(card, result.action === 'added');
    this.ui.updateConfirmButton(this.state.canConfirm());
  }

  useHint() {
    if (this.state.hintUsed) return;

    const hintCards = GameLogic.generateHint(this.state.characterDataMap);
    if (!hintCards) return;

    this.state.selectedCards = [];
    this.ui.clearSelectedCards();

    this.state.selectedCards.push(...hintCards);
    
    const visibleCards = Array.from(document.querySelectorAll("#group-container .card"));
    visibleCards.forEach(card => {
      if (hintCards.includes(card.dataset.name)) {
        this.ui.toggleCardSelection(card, true);
      }
    });

    this.ui.updateConfirmButton(this.state.canConfirm());
    this.state.hintUsed = true;
    this.ui.updateHintButton(this.state.hintUsed);
  }

  async handleConfirm() {
    const isMatch = GameLogic.checkMatch(this.state.selectedCards, this.state.characterDataMap);

    if (isMatch) {
      await this.handleCorrectGuess();
    } else {
      await this.handleWrongGuess();
    }
  }

  async handleCorrectGuess() {
    const groupInfo = this.state.characterDataMap.get(this.state.selectedCards[0]).groupInfo;
    const [feature, value] = groupInfo.split(":");

    console.log(`TRUE ANSWER: ${this.state.selectedCards.map((n, i) => `${i + 1}. ${n}`).join(", ")} - ${feature}: ${value}`);

    this.ui.addMatchedGroup(this.state.selectedCards, groupInfo, this.state.characterDataMap);
    this.ui.removeCards(this.state.selectedCards);
    
    this.state.selectedCards = [];
    this.ui.updateConfirmButton(this.state.canConfirm());

    await NotificationManager.showCorrectGuess();

    if (this.ui.isGameComplete()) {
      const shouldRestart = await NotificationManager.showGameComplete(this.state);
      if (shouldRestart) {
        this.resetGame();
      }
    }
  }

  async handleWrongGuess() {
    const isGameOver = this.state.addMistake();
    this.ui.updateHearts(this.state.mistakeCount);

    if (isGameOver) {
      const answersHTML = this.ui.getAllAnswersHTML(this.state.characterDataMap);
      const shouldRestart = await NotificationManager.showGameOver(this.state, answersHTML);
      if (shouldRestart) {
        this.resetGame();
      }
      return;
    }

    const analysis = GameLogic.analyzeWrongGuess(this.state.selectedCards, this.state.characterDataMap);
    await NotificationManager.showWrongGuess(analysis.isThreeOfOneKind);
  }
}

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener("DOMContentLoaded", () => {
  new Game();
});