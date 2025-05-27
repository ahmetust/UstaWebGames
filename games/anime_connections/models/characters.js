// models/characters.js - Karakter verilerini yükleme
const fs = require('fs');
const path = require('path');

// JSON verilerini yükle
const loadCharactersFromJson = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'characters.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Karakter verileri yüklenirken hata oluştu:', error);
    return [];
  }
};

module.exports = {
  loadCharactersFromJson
};