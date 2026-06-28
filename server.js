const http = require("http");
const WebSocket = require("ws");

// ================= SERVER HTTP =================
const PORT = process.env.PORT || 10000;

let clients = [];

const server = http.createServer((req, res) => {

  // [PERBAIKAN 1]: Ganti /stream jadi /video_feed biar cocok sama Flutter!
  if (req.url === "/video_feed") {
    res.writeHead(200, {
      "Content-Type": "multipart/x-mixed-replace; boundary=frame",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Pragma": "no-cache",
    });

    clients.push(res);

    req.on("close", () => {
      clients = clients.filter((c) => c !== res);
    });

  } else {
    res.writeHead(200);
    res.end("MJPEG Stream Server is Running...");
  }
});

// ================= WEBSOCKET =================
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("ESP32 connected");

  ws.on("message", (data) => {
    // [PERBAIKAN 2]: Cek dulu apakah datanya punya header dari ESP32
    if (data.length > 2) {
      const type = data[1]; // Baca byte kedua (0x01 = Video, 0x02 = Audio)

      if (type === 1) { // Hanya proses kalau itu adalah paket Video
        // Potong 2 byte pertama (header) agar menjadi gambar JPEG yang valid
        const jpegData = data.slice(2);

        clients.forEach((res) => {
          res.write(`--frame\r\n`);
          res.write(`Content-Type: image/jpeg\r\n`);
          res.write(`Content-Length: ${jpegData.length}\r\n\r\n`);
          res.write(jpegData); // Kirim gambar yang sudah bersih dari header
          res.write("\r\n");
        });
      }
      // Audio (type === 2) bisa kamu handle di sini nanti kalau mau diterusin
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
