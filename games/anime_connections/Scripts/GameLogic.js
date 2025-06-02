// GameLogic.js - Oyun mantığı
export class GameLogic {
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static checkMatch(selectedCards, characterDataMap) {
    const groupValues = selectedCards.map(name => characterDataMap.get(name)?.groupInfo);
    return groupValues.every(group => group === groupValues[0]);
  }

  static analyzeWrongGuess(selectedCards, characterDataMap) {
    const groupCountMap = {};
    selectedCards.forEach(name => {
      const group = characterDataMap.get(name)?.groupInfo;
      if (group) {
        groupCountMap[group] = (groupCountMap[group] || 0) + 1;
      }
    });

    const groupEntries = Object.entries(groupCountMap);
    const hasThreeOfOneKind = groupEntries.some(([_, count]) => count === 3);
    const hasTwoGroups = groupEntries.length === 2;
    
    return {
      isThreeOfOneKind: hasThreeOfOneKind && hasTwoGroups,
      groupCount: groupEntries.length
    };
  }

  static generateHint(characterDataMap) {
    const visibleCards = Array.from(document.querySelectorAll("#group-container .card"));
    const visibleNames = visibleCards.map(card => card.dataset.name);

    const groupToVisibleNames = {};
    visibleNames.forEach(name => {
      const info = characterDataMap.get(name);
      if (!info) return;
      if (!groupToVisibleNames[info.groupInfo]) {
        groupToVisibleNames[info.groupInfo] = [];
      }
      groupToVisibleNames[info.groupInfo].push(name);
    });

    const availableGroups = Object.entries(groupToVisibleNames)
      .filter(([_, names]) => names.length >= 2);

    if (availableGroups.length === 0) return null;

    const [groupKey, names] = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    return names.slice(0, 2); // İlk iki ismi döndür
  }

  static async loadCharactersData(gameMode) {
    const response = await fetch(`/api/generate-groups?mode=${gameMode}&logOnly=final`);
    const data = await response.json();
    
    const characterDataMap = new Map();
    const allCharacters = Object.values(data.groups).flatMap(group =>
      group.characters.map(character => {
        characterDataMap.set(character.Name, {
          groupInfo: `${group.feature}:${group.value}`,
          imageUrl: character.Resimler,
          difficulty: group.difficulty
        });
        return character;
      })
    );

    return {
      characters: this.shuffleArray(allCharacters),
      characterDataMap,
      totalCharacters: data.totalCharacters
    };
  }
}