// GameState.js - Oyun durumu yönetimi
import { GAME_CONFIG, GAME_MODES } from './GameConfig.js';

export class GameState {
  constructor() {
    this.selectedCards = [];
    this.hintUsed = false;
    this.characterDataMap = new Map();
    this.mistakeCount = 0;
    this.currentGameMode = GAME_MODES.NORMAL;
    this.gameStartTime = null;
  }

  reset() {
    this.selectedCards = [];
    this.hintUsed = false;
    this.characterDataMap.clear();
    this.mistakeCount = 0;
    this.gameStartTime = Date.now();
  }

  addMistake() {
    this.mistakeCount++;
    return this.mistakeCount >= GAME_CONFIG.MAX_MISTAKES;
  }

  selectCard(name) {
    if (this.selectedCards.includes(name)) {
      this.selectedCards = this.selectedCards.filter(n => n !== name);
      return { action: 'removed', canSelect: true };
    }
    
    if (this.selectedCards.length >= GAME_CONFIG.MAX_SELECTED_CARDS) {
      return { action: 'limit_reached', canSelect: false };
    }
    this.selectedCards.push(name);
    return { action: 'added', canSelect: true };
  }

  canConfirm() {
    return this.selectedCards.length === GAME_CONFIG.MAX_SELECTED_CARDS;
  }

  calculateScore() {
    if (!this.gameStartTime) return 0;
    
    const gameEndTime = Date.now();
    const elapsedSeconds = Math.floor((gameEndTime - this.gameStartTime) / 1000);
    const timeBonus = Math.max(0, GAME_CONFIG.MAX_BONUS - Math.floor((elapsedSeconds / GAME_CONFIG.MAX_TIME) * GAME_CONFIG.MAX_BONUS));
    
    let score = GAME_CONFIG.START_SCORE - (this.mistakeCount * GAME_CONFIG.PENALTY) + timeBonus;
    return Math.max(0, score);
  }

  getElapsedTime() {
    if (!this.gameStartTime) return 0;
    return Math.floor((Date.now() - this.gameStartTime) / 1000);
  }
}