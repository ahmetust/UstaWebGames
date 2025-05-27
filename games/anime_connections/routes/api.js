const express = require('express');
const router = express.Router();
const { loadHardCharactersFromJson, loadEasyCharactersFromJson, loadNormalCharactersFromJson } = require('../models/characters.js');
const { listeleriSozlugaCevir } = require('../utils/helpers.js');
const { yapSecimler } = require('../services/featureSelector.js');
const { createCharacterGroups } = require('../services/characterGrouper.js');
const { dizi } = require('../config/tag_scoring.js');

// Zorluk haritası
const PUAN_TABLOSU = {
  "puan2": "Easy",
  "puan3": "Easy",
  "puan4": "Normal",
  "puan5": "Normal",
  "puan6": "Hard",
  "puan7": "Hard",
  "puan8": "Hard",
  "puan9": "Hard"
};

function getDifficultyByFeature(feature) {
  for (const [puan, features] of Object.entries(dizi)) {
    if (features.includes(feature)) return PUAN_TABLOSU[puan] || "Normal";
  }
  return "Normal";
}

// API endpoint to generate character groups
router.get('/generate-groups', (req, res) => {
  try {
    // Query parametresinden mod bilgisini al (varsayılan: hard)
    const mode = req.query.mode || 'hard';
    
    // Mod türüne göre karakterleri yükle
    let characters;
    switch (mode) {
      case 'easy':
        characters = loadEasyCharactersFromJson();
        console.log('Kolay mod aktif - Popüler karakterler yüklendi');
        break;
      case 'normal':
        characters = loadNormalCharactersFromJson();
        console.log('Normal mod aktif - Orta seviye karakterler yüklendi');
        break;
      case 'hard':
      default:
        characters = loadHardCharactersFromJson();
        console.log('Zor mod aktif - Tüm karakterler yüklendi');
        break;
    }
    
    if (characters.length === 0) {
      return res.status(500).json({ error: 'Karakter verileri yüklenemedi' });
    }
    
    const sozluk = listeleriSozlugaCevir(dizi);
    const secimler = yapSecimler(sozluk, characters);
    const groups = createCharacterGroups(characters, secimler);

    // Her gruba zorluk ekle
    for (const key in groups) {
      const group = groups[key];
      group.difficulty = getDifficultyByFeature(group.feature);
    }

    res.json({
      mode: mode,
      totalCharacters: characters.length,
      selectedFeatures: secimler,
      groups: groups
    });
  } catch (error) {
    console.error('Gruplar oluşturulurken hata:', error);
    res.status(500).json({ error: 'Gruplar oluşturulurken bir hata oluştu' });
  }
});

module.exports = router;