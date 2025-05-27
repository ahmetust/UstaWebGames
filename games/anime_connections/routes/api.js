const express = require('express');
const router = express.Router();
const { loadCharactersFromJson } = require('../models/characters.js');
const { listeleriSozlugaCevir } = require('../utils/helpers.js');
const { yapSecimler } = require('../services/featureSelector.js');
const { createCharacterGroups } = require('../services/characterGrouper.js');
const { dizi } = require('../config/tag_scoring.js');

// Zorluk haritası
const PUAN_TABLOSU = {
  "puan2": "Kolay",
  "puan3": "Kolay",
  "puan4": "Orta",
  "puan5": "Orta",
  "puan6": "Zor",
  "puan7": "Zor",
  "puan8": "Çok Zor",
  "puan9": "Çok Zor"
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
    const characters = loadCharactersFromJson();
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
      selectedFeatures: secimler,
      groups: groups
    });
  } catch (error) {
    console.error('Gruplar oluşturulurken hata:', error);
    res.status(500).json({ error: 'Gruplar oluşturulurken bir hata oluştu' });
  }
});

module.exports = router;