const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use('/games', express.static('games')); // Oyun dosyaları
// Bu satırı ekle


// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Anime Connections oyunu
app.get('/anime-connections', (req, res) => {
    res.sendFile(path.join(__dirname, 'games/anime_connections/index.html'));
});

// Anime Connections api
const anime_connections_api_router = require('./games/anime_connections/routes/api');
app.use('/api', anime_connections_api_router);  // /api yoluyla gelen istekleri apiRouter'a yönlendir





// 404 sayfası
app.get('*', (req, res) => {
    res.status(404).send(`
        <html>
            <head><title>Sayfa Bulunamadı</title></head>
            <body style="text-align: center; font-family: Arial; padding: 50px;">
                <h1>🚫 404 - Sayfa Bulunamadı</h1>
                <p>Aradığınız sayfa mevcut değil.</p>
                <a href="/" style="color: blue;">Ana Sayfaya Dön</a>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🎮 Oyun Merkezi çalışıyor: http://localhost:${PORT}`);
    console.log(`📱 games:`);
    console.log(`   • Anime Connections: http://localhost:${PORT}/anime-connections`);
    console.log(`   • Ana Sayfa: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server kapatılıyor...');
    process.exit(0);
});