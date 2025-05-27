// models/characters.js - Karakter verilerini yükleme
const fs = require('fs');
const path = require('path');

// JSON verilerini yükle
const loadHardCharactersFromJson = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'characters.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Karakter verileri yüklenirken hata oluştu:', error);
    return [];
  }
};



const loadEasyCharactersFromJson = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'characters.json'), 'utf8');
    const allCharacters = JSON.parse(data);
    
    const easyModeCharacters = allCharacters.filter(character => {
      const popularity = character['Anime Popularity'];
      return popularity === 'Anime Popularity 1-20' || popularity === 'Anime Popularity 21-50';
    });
    
    console.log(`Kolay mod: ${easyModeCharacters.length} popüler karakter yüklendi`);
    return easyModeCharacters;
  } catch (error) {
    console.error('Kolay mod karakter verileri yüklenirken hata oluştu:', error);
    return [];
  }
};




const loadNormalCharactersFromJson = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'characters.json'), 'utf8');
    const allCharacters = JSON.parse(data);
    
    const easyModeCharacters = allCharacters.filter(character => {
      const popularity = character['Anime Popularity'];
      return popularity === 'Anime Popularity 1-20' || popularity === 'Anime Popularity 21-50' || popularity === 'Anime Popularity 51-100';
    });
    
    console.log(`Kolay mod: ${easyModeCharacters.length} popüler karakter yüklendi`);
    return easyModeCharacters;
  } catch (error) {
    console.error('Kolay mod karakter verileri yüklenirken hata oluştu:', error);
    return [];
  }
};




module.exports = {
  loadHardCharactersFromJson,
  loadNormalCharactersFromJson,
  loadEasyCharactersFromJson
};