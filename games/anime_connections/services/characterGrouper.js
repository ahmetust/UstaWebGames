// services/characterGrouper.js - Ana Giriş Noktası

// Tüm modülleri import et
const { analyzeCharacterFeatures, checkCharacterIsValid, evaluateTraitDifficulty } = require('./characterAnalyzer');
const { shuffleArray, selectCharactersForFeature } = require('./characterSelector');
const { validateGroups, printDetailedResults, checkGroupOverlaps } = require('./groupValidator.js');
const { createCharacterGroups } = require('./groupCreator');

/**
 * Ana karakter gruplandırma servisi
 * Tüm fonksiyonları tek bir yerden export eder (Backward Compatibility için)
 */
module.exports = {
  // Analiz fonksiyonları
  analyzeCharacterFeatures,
  checkCharacterIsValid,
  evaluateTraitDifficulty,
  
  // Seçim fonksiyonları
  shuffleArray,
  selectCharactersForFeature,
  
  // Doğrulama fonksiyonları
  validateGroups,
  printDetailedResults,
  checkGroupOverlaps,
  
  // Ana fonksiyon
  createCharacterGroups
};