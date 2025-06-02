// GameConfig.js - Oyun sabitları ve yapılandırması
export const GAME_CONFIG = {
  MAX_MISTAKES: 5,
  START_SCORE: 25,
  PENALTY: 5,
  MAX_TIME: 180, // 3 dakika
  MAX_BONUS: 30,
  MAX_SELECTED_CARDS: 4
};

export const GAME_MODES = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

export const MODE_TEXTS = {
  [GAME_MODES.EASY]: 'Easy Mode',
  [GAME_MODES.NORMAL]: 'Normal Mode',
  [GAME_MODES.HARD]: 'Hard Mode'
};