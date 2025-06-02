// services/groupCreator.js
// Ana grup oluşturma mantığı - Esnek trait hafızası ile

const { analyzeCharacterFeatures, evaluateTraitDifficulty } = require('./characterAnalyzer');
const { shuffleArray, selectCharactersForFeature } = require('./characterSelector');
const { validateGroups, printDetailedResults } = require('./groupValidator');

// Trait history - son 6 oyunu takip eder
let traitHistory = [];
const MEMORY_SIZE = 20; // Son kaç oyunu hatırlayacak

/**
 * Trait'in son kullanım sıklığına göre weight hesaplar
 * @param {string} trait - Trait adı
 * @returns {number} Weight değeri (1.0 = normal, daha düşük = daha az şans)
 */
const calculateTraitWeight = (trait) => {
  const recentUsages = traitHistory.filter(t => t === trait).length;
  
  // Son 6 oyunda hiç çıkmadıysa normal weight
  if (recentUsages === 0) return 1.0;
  
  // Her kullanım için weight'i azalt ama tamamen sıfırlamayın
  // 1 kullanım = 0.7, 2 kullanım = 0.4, 3+ kullanım = 0.2
  switch (recentUsages) {
    case 1: return 0.4;
    case 2: return 0.2;
    default: return 0; // 3 veya daha fazla
  }
};

/**
 * Trait history'ye yeni trait ekler
 * @param {string} trait - Eklenen trait
 */
const addToTraitHistory = (trait) => {
  traitHistory.push(trait);
  
  // Hafıza boyutunu aş, eski olanları sil
  if (traitHistory.length > MEMORY_SIZE) {
    traitHistory = traitHistory.slice(-MEMORY_SIZE);
  }
};

/**
 * Trait history durumunu gösterir
 */
const printTraitHistory = () => {
  if (traitHistory.length > 0) {
    console.log(`\n=== TRAIT HAFIZASI (Son ${traitHistory.length} oyun) ===`);
    console.log(`Son çıkan traitler: ${traitHistory.join(' -> ')}`);
    
    // Her trait'in weight'ini göster
    const uniqueTraits = [...new Set(traitHistory)];
    uniqueTraits.forEach(trait => {
      const count = traitHistory.filter(t => t === trait).length;
      const weight = calculateTraitWeight(trait);
      console.log(`  ${trait}: ${count} kez, weight: ${weight.toFixed(1)}`);
    });
  }
};

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
  printTraitHistory();

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

    // Trait-based gruplar için gerçek weighted random selection
    if (Object.keys(groupsCreated).length === 2) {
      const availableTraits = Object.keys(featureStats["Traits"] || {})
        .filter(t => featureStats["Traits"][t].size >= groupSize)
        .map(trait => ({
          trait,
          difficulty: evaluateTraitDifficulty(trait, featureStats),
          availableCount: featureStats["Traits"][trait].size,
          weight: calculateTraitWeight(trait)
        }));

      // Zorluğa göre ayır
      const easyTraits = availableTraits.filter(t => t.difficulty <= 2);
      const hardTraits = availableTraits.filter(t => t.difficulty > 2);

      let traitGroupsCreated = 0;
      const difficultyLabels = ["Zor Seçim", "Çok Zor Seçim"];
      const selectedTraitsThisRound = [];

      // Her zorluk seviyesi için weighted random selection
      const traitPools = [easyTraits, hardTraits];
      
      for (let poolIndex = 0; poolIndex < traitPools.length && traitGroupsCreated < 2; poolIndex++) {
        const pool = traitPools[poolIndex];
        if (pool.length === 0) continue;

        // Weighted random selection
        let selectedTrait = null;
        let attempts = 0;
        const maxSelectionAttempts = 50;

        while (!selectedTrait && attempts < maxSelectionAttempts) {
          attempts++;
          
          // Weight toplamını hesapla
          const totalWeight = pool.reduce((sum, t) => sum + t.weight, 0);
          
          if (totalWeight <= 0) {
            // Tüm weight'ler 0 ise random seç
            selectedTrait = pool[Math.floor(Math.random() * pool.length)];
            break;
          }

          // Random değer seç
          let randomValue = Math.random() * totalWeight;
          
          // Weighted selection
          for (const traitInfo of pool) {
            randomValue -= traitInfo.weight;
            if (randomValue <= 0) {
              selectedTrait = traitInfo;
              break;
            }
          }
        }

        if (!selectedTrait) {
          // Fallback - weight'e bakmadan random seç
          selectedTrait = pool[Math.floor(Math.random() * pool.length)];
        }

        // Seçilen trait ile grup oluşturmayı dene
        const selected = selectCharactersForFeature(
          characters,
          "Traits",
          selectedTrait.trait,
          groupSize,
          tempUsedCharacters,
          tempMainFeatures,
          freshSelectionHistory
        );

        if (selected.length === groupSize) {
          const difficulty = difficultyLabels[traitGroupsCreated];
          groupsCreated[difficulty] = {
            feature: "Traits",
            value: selectedTrait.trait,
            characters: selected
          };
          
          selected.forEach(c => tempUsedCharacters.add(c.Name));
          tempMainFeatures.add(`Traits:${selectedTrait.trait}`);
          
          selectedTraitsThisRound.push(selectedTrait.trait);
          traitGroupsCreated++;
          
          if (attempt === 1) {
            console.log(`✓ ${difficulty}: Traits=${selectedTrait.trait} (difficulty: ${selectedTrait.difficulty}, weight: ${selectedTrait.weight.toFixed(1)})`);
          }
        } else {
          // Bu trait çalışmadı, pool'dan çıkar ve tekrar dene
          const traitIndex = pool.indexOf(selectedTrait);
          if (traitIndex > -1) {
            pool.splice(traitIndex, 1);
          }
          poolIndex--; // Bu pool'u tekrar dene
          break;
        }
      }

      if (traitGroupsCreated === 2 && validateGroups(groupsCreated, false)) {
        // Başarılı grup oluşturuldu, trait history'yi güncelle
        selectedTraitsThisRound.forEach(trait => addToTraitHistory(trait));
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

/**
 * Trait history'yi temizler (test amaçlı)
 */
const clearTraitHistory = () => {
  traitHistory = [];
  console.log("Trait hafızası temizlendi.");
};

/**
 * Trait history'yi manuel olarak ayarlar (test amaçlı)
 * @param {Array} newHistory - Yeni history array'i
 */
const setTraitHistory = (newHistory) => {
  traitHistory = newHistory.slice(-MEMORY_SIZE); // Sadece son MEMORY_SIZE kadarını al
  console.log(`Trait hafızası ayarlandı: ${traitHistory.join(' -> ')}`);
};

module.exports = {
  createCharacterGroups,
  clearTraitHistory,
  setTraitHistory,
  printTraitHistory
};