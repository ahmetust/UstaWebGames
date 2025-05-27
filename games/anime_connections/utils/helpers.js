// utils/helpers.js - Yardımcı fonksiyonlar
// Listeleri sözlüğe çevir
const listeleriSozlugaCevir = (dizi) => {
    const sonucSozluk = {};
    for (const [listeAdi, elemanlar] of Object.entries(dizi)) {
      const puan = parseInt(listeAdi.slice(-1));
      for (const eleman of elemanlar) {
        sonucSozluk[eleman] = puan;
      }
    }
    return sonucSozluk;
  };
  
  module.exports = {
    listeleriSozlugaCevir
  };