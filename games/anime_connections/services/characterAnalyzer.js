// services/characterAnalyzer.js
// Karakter özelliklerini analiz etme işlemleri

/**
 * Karakterlerin özelliklerini analiz eder ve istatistik oluşturur
 * Tüm traitlerin ve özelliklerin kayıt edilmesi
 * @param {Array} characters - Karakter dizisi
 * @returns {Object} Özellik istatistikleri
 */
const analyzeCharacterFeatures = (characters) => {
  const featureStats = {};

  const addFeatureToStats = (feature, val, char) => {
    if (!val || val === "0") return; // boş veya "0" trait ekleme
    if (!featureStats[feature]) featureStats[feature] = {};
    if (!featureStats[feature][val]) featureStats[feature][val] = new Set();
    featureStats[feature][val].add(char["Name"]);
  };

  for (const char of characters) {
    for (const [feature, value] of Object.entries(char)) {
      if (!value || feature === "Name") continue;

      if (feature === "Traits" && Array.isArray(value)) {
         if (value.length > 0) {
          value.forEach(trait => {
            if (trait && trait !== "0") {  // boş ve "0" traitleri atla
              addFeatureToStats(feature, trait, char);
            }
          });
        }
      } else {
        addFeatureToStats(feature, value, char);
      }
    }
  }

  return featureStats;
};

/**
 * Bir karakterin ana özelliklerle çakışıp çakışmadığını kontrol eder
 * @param {Object} character - Kontrol edilecek karakter
 * @param {Set} mainFeatures - Ana özellikler seti
 * @returns {boolean} Geçerli ise true
 */
function checkCharacterIsValid(character, mainFeatures) {
  for (const [feature, value] of Object.entries(character)) {
    if (!value || feature === "Name") continue;

    const checkValue = (val) => {
      const key = `${feature}:${val}`;
      if (mainFeatures.has(key)) return false;
      return true;
    };

    if (feature === "Traits" && Array.isArray(value)) {
      for (const trait of value) {
        if (!checkValue(trait)) return false;
      }
    } else {
      if (!checkValue(value)) return false;
    }
  }
  return true;
}

/**
 * Trait zorluğunu değerlendiren fonksiyon
 * Traitin sayısına göre zorluk veriyor
 * @param {string} trait - Trait adı
 * @param {Object} featureStats - Özellik istatistikleri
 * @returns {number} Zorluk derecesi (1-4)
 */
const evaluateTraitDifficulty = (trait, featureStats) => {
  const traitCount = featureStats["Traits"][trait]?.size || 0;
  if (traitCount >= 15) return 1; // Kolay
  if (traitCount >= 8) return 2;  // Orta
  if (traitCount >= 5) return 3;  // Zor
  return 4; // Çok Zor
};

module.exports = {
  analyzeCharacterFeatures,
  checkCharacterIsValid,
  evaluateTraitDifficulty
};