const express = require('express');
const EventEmitter = require('events');
const app = express();
const http = require('http').Server(app);

// Pemancar video internal
const frameEmitter = new EventEmitter();
let lastFrame = null;

// Endpoint untuk menerima gambar dari ESP32
app.use(express.raw({ type: 'image/jpeg', limit: '500kb' }));

app.post('/upload', (req, res) => {
    lastFrame = req.body;
    // Pancarkan frame ke Flutter
    frameEmitter.emit('frame', lastFrame);
    res.sendStatus(200);
});

// Endpoint untuk Flutter mengambil video (MJPEG Stream)
app.get('/video_feed', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache'
    });

    // Langsung kirim frame terakhir agar Flutter tidak menunggu lama
    if (lastFrame) {
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${lastFrame.length}\r\n\r\n`);
        res.write(lastFrame);
        res.write('\r\n');
    }

    // Fungsi untuk mengirim frame secara terus-menerus
    const sendFrame = (frame) => {
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
        res.write(frame);
        res.write('\r\n');
    };

    // Dengarkan kiriman dari ESP32
    frameEmitter.on('frame', sendFrame);

    // Hapus pendengar jika Flutter ditutup (agar server tidak berat)
    req.on('close', () => {
        frameEmitter.removeListener('frame', sendFrame);
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log(`Server Relay Berjalan di Port ${PORT}`));
