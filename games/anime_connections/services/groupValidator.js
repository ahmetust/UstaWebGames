// services/groupValidator.js
// Grup doğrulama ve çıktı işlemleri

/**
 * Grup sonuçlarını detaylı şekilde konsola yazdırır
 * @param {Object} results - Grup sonuçları
 */
const printDetailedResults = (results) => {
  console.log("\n=== BAŞARILI GRUPLANDIRMA SONUÇLARI ===");
  
  for (const [difficulty, group] of Object.entries(results)) {
    console.log(`\n## ${difficulty.toUpperCase()} ##`);
    console.log(`Özellik: ${group.feature} = ${group.value}`);
    console.log(`Karakter Sayısı: ${group.characters.length}`);
    
    console.log("\nKarakterler:");
    group.characters.forEach(char => {
      const traits = char.Traits?.length > 0 ? ` [Traits: ${char.Traits.join(", ")}]` : "";
      console.log(`- ${char.Name}${traits}`);
    });
  }

  checkGroupOverlaps(results);
};

/**
 * Gruplar arasındaki çakışmaları kontrol eder
 * @param {Object} results - Grup sonuçları
 * @returns {boolean} Çakışma yoksa true
 */
const checkGroupOverlaps = (results) => {
  const mainFeatures = new Map();
  let conflictCount = 0;

  // Ana feature çakışmalarını kontrol et
  for (const [difficulty, group] of Object.entries(results)) {
    const key = `${group.feature}:${group.value}`;
    if (mainFeatures.has(key)) {
      conflictCount++;
    }
    mainFeatures.set(key, difficulty);
  }

  // Karakter özellik çakışmalarını kontrol et
  for (const [difficulty, group] of Object.entries(results)) {
    for (const char of group.characters) {
      for (const [feature, value] of Object.entries(char)) {
        if (!value || feature === "Name") continue;

        const checkValue = (val) => {
          const key = `${feature}:${val}`;
          if (mainFeatures.has(key) && mainFeatures.get(key) !== difficulty) {
            conflictCount++;
          }
        };

        if (feature === "Traits" && Array.isArray(value)) {
          value.forEach(checkValue);
        } else {
          checkValue(value);
        }
      }
    }
  }

  console.log(conflictCount > 0 ? `\n❌ ${conflictCount} çakışma var` : "\n✅ Çakışma yok, gruplar geçerli");
  
  return conflictCount === 0;
};

/**
 * Grupların geçerliliğini doğrular
 * @param {Object} results - Grup sonuçları
 * @param {boolean} verbose - Detaylı çıktı
 * @returns {boolean} Geçerli ise true
 */
const validateGroups = (results, verbose = true) => {
  if (!results) return false;
  return checkGroupOverlaps(results);
};

module.exports = {
  printDetailedResults,
  checkGroupOverlaps,
  validateGroups
};