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
 * Belirtilen özellik için bias-free ve anime çeşitliliğini gözeten karakter seçimi yapar.
 * Bir özellikten hangi karakter gelmişse onların o özellikten bir daha gelme şansını azaltır.
 * Ek olarak, bir grup oluşturulurken aynı animeden birden fazla karakter gelme olasılığını düşürür.
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

  // 1. ADIM: İstenen özelliğe uyan ve dışlanmamış tüm karakterleri bul.
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

  // Yeterli sayıda uygun karakter yoksa, boş dizi döndür.
  if (eligible.length < count) {
    return [];
  }

  // 2. ADIM: Ağırlıklandırma için hazırlık yap.
  // Önceki oyunlarda seçilmiş karakterlerin ağırlığını düşür.
  const featureKey = `${feature}:${value}`;
  const previouslySelected = previousSelections.get(featureKey) || new Set();
  
  const weightedEligible = eligible.map(char => ({
    char,
    weight: previouslySelected.has(char.Name) ? 0.3 : 1.0
  }));

  // 3. ADIM: Geliştirilmiş rastgele seçim döngüsü
  const selectedCharacters = [];
  const availableChars = [...weightedEligible]; // Seçim yapılacak karakterlerin kopyası

  // İstenen sayıda karakter seçmek için döngüye gir.
  for (let i = 0; i < count && availableChars.length > 0; i++) {
    // Toplam ağırlığı her döngüde yeniden hesaplıyoruz, çünkü ağırlıklar değişecek.
    const totalWeight = availableChars.reduce((sum, item) => sum + item.weight, 0);
    
    // Eğer seçilebilecek ağırlığa sahip karakter kalmadıysa döngüden çık.
    if (totalWeight <= 0) break;

    let randomWeight = Math.random() * totalWeight;
    let selectedIndex = -1;

    for (let j = 0; j < availableChars.length; j++) {
      randomWeight -= availableChars[j].weight;
      if (randomWeight <= 0) {
        selectedIndex = j;
        break;
      }
    }

    // Bir karakterin seçildiğinden emin ol.
    if (selectedIndex === -1) continue;

    // Seçilen karakteri listeden çıkar ve sonuç dizisine ekle.
    const selected = availableChars.splice(selectedIndex, 1)[0];
    selectedCharacters.push(selected.char);
    
    // --- YENİ EKLENEN ANİME ÇEŞİTLİLİĞİ MANTIĞI ---
    // Seçilen karakterin animesini al.
    const selectedAnime = selected.char["Anime Name"];
    if (selectedAnime) {
      // Kalan karakterler listesini dolaş ve aynı animeden olanların ağırlığını düşür.
      // Bu, bir sonraki seçimde farklı bir animeden karakter gelme olasılığını artırır.
      availableChars.forEach(item => {
        if (item.char["Anime Name"] === selectedAnime) {
          item.weight *= 0.2; // Etki gücünü bu çarpanı değiştirerek ayarlayabilirsiniz (0.1, 0.3 vb.).
        }
      });
    }
  }

  // 4. ADIM: Seçimleri kaydet ve sonucu döndür.
  // Sadece tam olarak istenen sayıda karakter seçilebildiyse bu grubu geçerli say.
  if (selectedCharacters.length === count) {
    if (!previousSelections.has(featureKey)) {
      previousSelections.set(featureKey, new Set());
    }
    selectedCharacters.forEach(char => {
      previousSelections.get(featureKey).add(char.Name);
    });
    return selectedCharacters;
  }
  
  // Eğer istenen sayıda karakter bulunamadıysa (örn. çeşitlilik yüzünden),
  // bu deneme başarısızdır ve boş dizi döndürülür.
  return [];
};

module.exports = {
  shuffleArray,
  selectCharactersForFeature
};