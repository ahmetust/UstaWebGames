// services/featureSelector.js - Özellik seçim fonksiyonları
// Özellik seçim fonksiyonları
const secBasit = (sozluk, kullanilmisElemanlar) => {
    const secenek = Math.floor(Math.random() * 3) + 1; // 1, 2, veya 3
    
    // Kullanılabilir elemanları filtrele
    const ikiPuanli = Object.keys(sozluk).filter(key => 
      sozluk[key] === 2 && !kullanilmisElemanlar.has(key)
    );
    
    const ucPuanli = Object.keys(sozluk).filter(key => 
      sozluk[key] === 3 && !kullanilmisElemanlar.has(key)
    );
    
    if (secenek === 2 && ikiPuanli.length > 0) {
      return [ikiPuanli[Math.floor(Math.random() * ikiPuanli.length)]];
    } else if (ucPuanli.length > 0) {
      return [ucPuanli[Math.floor(Math.random() * ucPuanli.length)]];
    }
    
    return [];
  };
  
  const secOrta = (sozluk, kullanilmisElemanlar) => {
    const secenek = Math.random() < 0.5 ? 4 : 5;
    
    const dortPuanli = Object.keys(sozluk).filter(key => 
      sozluk[key] === 4 && !kullanilmisElemanlar.has(key)
    );
    
    const besPuanli = Object.keys(sozluk).filter(key => 
      sozluk[key] === 5 && !kullanilmisElemanlar.has(key)
    );
    
    if (secenek === 4 && dortPuanli.length > 0) {
      return [dortPuanli[Math.floor(Math.random() * dortPuanli.length)]];
    } else if (besPuanli.length > 0) {
      return [besPuanli[Math.floor(Math.random() * besPuanli.length)]];
    }
    
    return [];
  };
  
  const secZor = (sozluk, kullanilmisElemanlar) => {
    const secenek = Math.random() < 0.5 ? 6 : 7;
    
    if (secenek === 6) {
      const altiPuanli = Object.keys(sozluk).filter(key => 
        sozluk[key] === 6 && !kullanilmisElemanlar.has(key)
      );
      
      if (altiPuanli.length > 0) {
        return [altiPuanli[Math.floor(Math.random() * altiPuanli.length)]];
      }
    } else {
      const yediPuanli = Object.keys(sozluk).filter(key => 
        sozluk[key] === 7 && !kullanilmisElemanlar.has(key)
      );
      
      if (yediPuanli.length > 0) {
        return [yediPuanli[Math.floor(Math.random() * yediPuanli.length)]];
      }
    }
    
    return [];
  };
  
  const secCokZor = (sozluk, kullanilmisElemanlar) => {
    const secenek = Math.random() < 0.5 ? 8 : 9;
    
    if (secenek === 8) {
      const sekizPuanli = Object.keys(sozluk).filter(key => 
        sozluk[key] === 8 && !kullanilmisElemanlar.has(key)
      );
      
      if (sekizPuanli.length > 0) {
        return [sekizPuanli[Math.floor(Math.random() * sekizPuanli.length)]];
      }
    } else {
      const dokuzPuanli = Object.keys(sozluk).filter(key => 
        sozluk[key] === 9 && !kullanilmisElemanlar.has(key)
      );
      
      if (dokuzPuanli.length > 0) {
        return [dokuzPuanli[Math.floor(Math.random() * dokuzPuanli.length)]];
      }
    }
    
    return [];
  };
  



// Her bir zorluk düzeyi için birden fazla özellik adayı sunan fonksiyon
const secEkOzellikler = (sozluk, kullanilmisElemanlar, zorlukDuzeyi) => {
  let puanAraligi;
  
  switch(zorlukDuzeyi) {
    case "Basit Seçim":
      puanAraligi = [2, 3];
      break;
    case "Orta Seçim": 
      puanAraligi = [4, 5];
      break;
    case "Zor Seçim":
      puanAraligi = [6, 7];
      break;
    case "Çok Zor Seçim":
      puanAraligi = [8, 9];
      break;
    default:
      puanAraligi = [2, 9];
  }
  
  // Bu zorluk düzeyi için uygun puanlı tüm özellikleri al
  const uygunOzellikler = Object.keys(sozluk).filter(key => 
    puanAraligi.includes(sozluk[key]) && !kullanilmisElemanlar.has(key)
  );
  
  // Rastgele 3 tanesini (veya daha az varsa hepsini) seç
  const sonuc = [];
  const kopyaUygunOzellikler = [...uygunOzellikler];
  
  const secilecekSayi = Math.min(3, kopyaUygunOzellikler.length);
  
  for (let i = 0; i < secilecekSayi; i++) {
    const randomIndex = Math.floor(Math.random() * kopyaUygunOzellikler.length);
    sonuc.push(kopyaUygunOzellikler[randomIndex]);
    kopyaUygunOzellikler.splice(randomIndex, 1);
  }
  
  return sonuc;
};






  const yapSecimler = (sozluk) => {
  const kullanilmisElemanlar = new Set();
  const sonuclar = {};
  
  // Her zorluk seviyesi için daha fazla alternatif özellik sağla
  const zorlukDuzeyleri = ["Basit Seçim", "Orta Seçim", "Zor Seçim", "Çok Zor Seçim"];
  
  for (const zorluk of zorlukDuzeyleri) {
    let secimler;
    
    switch(zorluk) {
      case "Basit Seçim":
        secimler = secBasit(sozluk, kullanilmisElemanlar);
        break;
      case "Orta Seçim":
        secimler = secOrta(sozluk, kullanilmisElemanlar);
        break;
      case "Zor Seçim":
        secimler = secZor(sozluk, kullanilmisElemanlar);
        break;
      case "Çok Zor Seçim":
        secimler = secCokZor(sozluk, kullanilmisElemanlar);
        break;
    }
    
    // Ana seçimi ekle
    if (secimler.length > 0) {
      secimler.forEach(elem => kullanilmisElemanlar.add(elem));
    }
    
    // Ek alternatif özellikler ekle
    const ekOzellikler = secEkOzellikler(sozluk, kullanilmisElemanlar, zorluk);
    secimler = [...secimler, ...ekOzellikler];
    
    sonuclar[zorluk] = secimler;
  }
  
  return sonuclar;
};

module.exports = {
  secBasit,
  secOrta,
  secZor,
  secCokZor,
  secEkOzellikler,
  yapSecimler
};