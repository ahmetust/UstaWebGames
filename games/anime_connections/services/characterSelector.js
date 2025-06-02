// services/characterSelector.js
// Karakter seçim işlemleri

const { checkCharacterIsValid } = require('./characterAnalyzer');

/**
 * Gerçek Fisher-Yates shuffle algoritması
 * @param {Array} array - Karıştırılacak dizi
 * @returns {Array} Karıştırılmış yeni dizi
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Belirtilen özellik için bias-free karakter seçimi yapar
 * Bir özellikten hangi karakter gelmişse onların o özellikten bir daha gelme şansını azaltır.
 * @param {Array} characters - Tüm karakterler
 * @param {string} feature - Seçim özelliği
 * @param {string} value - Özellik değeri
 * @param {number} count - Seçilecek karakter sayısı
 * @param {Set} excludedCharacters - Dışlanacak karakterler
 * @param {Set} mainFeatures - Ana özellikler
 * @param {Map} previousSelections - Önceki seçimler
 * @returns {Array} Seçilen karakterler
 */
const selectCharactersForFeature = (
  characters,
  feature,
  value,
  count,
  excludedCharacters,
  mainFeatures,
  previousSelections = new Map()
) => {
  const eligible = [];

  for (const char of characters) {
    if (excludedCharacters.has(char["Name"])) continue;

    if (feature === "Traits") {
      if (!Array.isArray(char[feature])) continue;
      if (char[feature].length === 0) continue;
      if (value === "0" || !value) continue; 
      if (!char[feature].includes(value)) continue;
    } else {
      if (char[feature] !== value) continue;
    }

    if (!checkCharacterIsValid(char, mainFeatures)) continue;
    eligible.push(char);
  }

  if (eligible.length < count) {
    return [];
  }

  // Çeşitlilik için önceki seçimleri dikkate al
  const featureKey = `${feature}:${value}`;
  const previouslySelected = previousSelections.get(featureKey) || new Set();
  
  // Weighted selection - daha önce seçilmeyenlere daha yüksek ağırlık
  const weightedEligible = eligible.map(char => ({
    char,
    weight: previouslySelected.has(char.Name) ? 0.3 : 1.0
  }));

  // Ağırlıklı random seçim
  const selectedCharacters = [];
  const availableChars = [...weightedEligible];

  for (let i = 0; i < count && availableChars.length > 0; i++) {
    const totalWeight = availableChars.reduce((sum, item) => sum + item.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    let selectedIndex = 0;
    for (let j = 0; j < availableChars.length; j++) {
      randomWeight -= availableChars[j].weight;
      if (randomWeight <= 0) {
        selectedIndex = j;
        break;
      }
    }

    const selected = availableChars.splice(selectedIndex, 1)[0];
    selectedCharacters.push(selected.char);
  }

  // Seçilen karakterleri kaydet
  if (!previousSelections.has(featureKey)) {
    previousSelections.set(featureKey, new Set());
  }
  selectedCharacters.forEach(char => {
    previousSelections.get(featureKey).add(char.Name);
  });

  return selectedCharacters;
};

module.exports = {
  shuffleArray,
  selectCharactersForFeature
};