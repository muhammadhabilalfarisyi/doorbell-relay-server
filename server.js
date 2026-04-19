const WebSocket = require('ws');

// Render akan otomatis memberikan PORT, jika dilokal pakai 10000
const PORT = process.env.PORT || 10000; 
const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Koneksi baru terhubung!');

    // Saat menerima gambar biner dari ESP32
    ws.on('message', (message) => {
        // Broadcast (teruskan) gambar tersebut ke semua HP/Aplikasi Flutter yang sedang membuka CCTV
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Koneksi terputus.');
    });
});

console.log(`Server WebSocket CCTV Pintu Mall berjalan di port ${PORT}`);
