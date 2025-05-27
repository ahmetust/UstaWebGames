// services/characterGrouper.js - Bias-Free Sürüm

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

// Gerçek Fisher-Yates shuffle
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Trait zorluğunu değerlendiren fonksiyon
const evaluateTraitDifficulty = (trait, featureStats) => {
  const traitCount = featureStats["Traits"][trait]?.size || 0;
  if (traitCount >= 15) return 1; // Kolay
  if (traitCount >= 8) return 2;  // Orta
  if (traitCount >= 5) return 3;  // Zor
  return 4; // Çok Zor
};

// Bias-free karakter seçim fonksiyonu
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

// Ana gruplandırma fonksiyonu - bias-free
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
    let tempResults = {};

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

const validateGroups = (results, verbose = true) => {
  if (!results) return false;
  return checkGroupOverlaps(results);
};

module.exports = {
  analyzeCharacterFeatures,
  checkCharacterIsValid,
  selectCharactersForFeature,
  createCharacterGroups,
  validateGroups,
  printDetailedResults
};