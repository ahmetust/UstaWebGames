// services/groupCreator.js
// Ana grup oluşturma mantığı

const { analyzeCharacterFeatures, evaluateTraitDifficulty } = require('./characterAnalyzer');
const { shuffleArray, selectCharactersForFeature } = require('./characterSelector');
const { validateGroups, printDetailedResults } = require('./groupValidator');

/**
 * Bias-free karakter grupları oluşturur
 * @param {Array} characters - Tüm karakterler
 * @param {Object} selectedFeatures - Seçilen özellikler
 * @param {number} groupSize - Grup büyüklüğü (varsayılan: 4)
 * @returns {Object|null} Oluşturulan gruplar veya null
 */
const createCharacterGroups = (characters, selectedFeatures, groupSize = 4) => {
  const maxAttempts = 1000;
  let attempt = 0;
  let finalResults = null;

  console.log("\n=== BIAS-FREE KARAKTER GRUPLANDIRMA BAŞLADI ===");

  while (!finalResults && attempt < maxAttempts) {
    attempt++;
    
    // Her attempt için fresh selection history
    const freshSelectionHistory = new Map();
    
    // Difficulty order'ı randomize et
    const difficultyOrder = shuffleArray(["Basit Seçim", "Orta Seçim"]);
    
    const featureStats = analyzeCharacterFeatures(characters);
    let tempUsedCharacters = new Set();
    let tempMainFeatures = new Set();

    if (attempt === 1) {
      // Anime Name istatistikleri
      if (featureStats["Anime Name"]) {
        console.log("\n=== ANIME NAME İSTATİSTİKLERİ ===");
        for (const [value, charSet] of Object.entries(featureStats["Anime Name"])) {
          console.log(`  ${value}: ${charSet.size} karakter`);
        }
      }
    }

    // Tüm olası kombinasyonları değerlendiren approach
    const allPossibleCombinations = [];
    
    for (const difficulty of difficultyOrder) {
      if (!selectedFeatures[difficulty]) continue;

      for (const feature of selectedFeatures[difficulty]) {
        if (!featureStats[feature]) continue;

        const possibleValues = Object.keys(featureStats[feature])
          .filter(v => v !== "0" && featureStats[feature][v].size >= groupSize);

        for (const value of possibleValues) {
          allPossibleCombinations.push({
            difficulty,
            feature,
            value,
            availableCount: featureStats[feature][value].size,
            // Diversity score - daha az kullanılan kombinasyonlar öncelikli
            diversityScore: Math.random()
          });
        }
      }
    }

    // Kombinasyonları diversity score'a göre sırala
    allPossibleCombinations.sort((a, b) => b.diversityScore - a.diversityScore);

    // En iyi kombinasyonları dene
    let groupsCreated = {};
    let usedDifficulties = new Set();

    for (const combo of allPossibleCombinations) {
      if (usedDifficulties.has(combo.difficulty)) continue;
      
      const featureKey = `${combo.feature}:${combo.value}`;
      if (tempMainFeatures.has(featureKey)) continue;

      const selected = selectCharactersForFeature(
        characters,
        combo.feature,
        combo.value,
        groupSize,
        tempUsedCharacters,
        tempMainFeatures,
        freshSelectionHistory
      );

      if (selected.length === groupSize) {
        groupsCreated[combo.difficulty] = {
          feature: combo.feature,
          value: combo.value,
          characters: selected
        };
        
        selected.forEach(c => tempUsedCharacters.add(c.Name));
        tempMainFeatures.add(featureKey);
        usedDifficulties.add(combo.difficulty);
        
        if (attempt === 1) {
          console.log(`✓ ${combo.difficulty}: ${combo.feature}=${combo.value} (${selected.length} karakter)`);
        }
      }
    }

    // Trait-based gruplar için bias-free approach
    if (Object.keys(groupsCreated).length === 2) {
      const availableTraits = Object.keys(featureStats["Traits"] || {})
        .filter(t => featureStats["Traits"][t].size >= groupSize)
        .map(trait => ({
          trait,
          difficulty: evaluateTraitDifficulty(trait, featureStats),
          availableCount: featureStats["Traits"][trait].size,
          randomScore: Math.random()
        }))
        .sort((a, b) => {
          // Önce zorluğa göre, sonra random score'a göre sırala
          if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
          return b.randomScore - a.randomScore;
        });

      let traitGroupsCreated = 0;
      const difficultyLabels = ["Zor Seçim", "Çok Zor Seçim"];

      for (const traitInfo of availableTraits) {
        if (traitGroupsCreated >= 2) break;

        const selected = selectCharactersForFeature(
          characters,
          "Traits",
          traitInfo.trait,
          groupSize,
          tempUsedCharacters,
          tempMainFeatures,
          freshSelectionHistory
        );

        if (selected.length === groupSize) {
          const difficulty = difficultyLabels[traitGroupsCreated];
          groupsCreated[difficulty] = {
            feature: "Traits",
            value: traitInfo.trait,
            characters: selected
          };
          
          selected.forEach(c => tempUsedCharacters.add(c.Name));
          tempMainFeatures.add(`Traits:${traitInfo.trait}`);
          traitGroupsCreated++;
          
          if (attempt === 1) {
            console.log(`✓ ${difficulty}: Traits=${traitInfo.trait} (difficulty: ${traitInfo.difficulty})`);
          }
        }
      }

      if (traitGroupsCreated === 2 && validateGroups(groupsCreated, false)) {
        finalResults = groupsCreated;
      }
    }

    if (finalResults) {
      if (attempt > 1) {
        console.log(`\n🔄 ${attempt} deneme sonunda başarılı oldu`);
      }
      console.log(`\n✅ Bias-free gruplar oluşturuldu!`);
      printDetailedResults(finalResults);
      break;
    }
  }

  if (!finalResults) {
    console.error(`\n❌ ${maxAttempts} denemede uygun grup kombinasyonu bulunamadı!`);
  }

  return finalResults;
};

module.exports = {
  createCharacterGroups
};