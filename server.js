const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let lastFrame = null;

// Endpoint untuk ESP32 mengirim gambar
app.use(express.raw({ type: 'image/jpeg', limit: '200kb' }));
app.post('/upload', (req, res) => {
    lastFrame = req.body;
    io.emit('video_frame', lastFrame.toString('base64'));
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

    const sendFrame = (frame) => {
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
        res.write(frame);
        res.write('\r\n');
    };

    io.on('video_frame', (base64) => {
        const frame = Buffer.from(base64, 'base64');
        sendFrame(frame);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server Relay Berjalan di Port ${PORT}`));
