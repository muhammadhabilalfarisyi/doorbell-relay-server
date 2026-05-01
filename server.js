const http = require("http");
const WebSocket = require("ws");

// ================= SERVER HTTP =================
const PORT = process.env.PORT || 10000;

let clients = [];
let lastFrame = null; // 🔥 simpan frame terakhir

const server = http.createServer((req, res) => {

  // ================= MJPEG STREAM =================
  if (req.url === "/stream") {
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

  }

  // ================= SNAPSHOT =================
  else if (req.url === "/capture") {

    if (!lastFrame) {
      res.writeHead(503);
      return res.end("No frame yet");
    }

    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-cache"
    });

    res.end(lastFrame);
  }

  // ================= ROOT =================
  else {
    res.writeHead(200);
    res.end("MJPEG Stream Server is Running...");
  }
});

// ================= WEBSOCKET =================
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("ESP32 connected");

  ws.on("message", (data) => {

    // 🔥 simpan frame terakhir (INI KUNCI PRO)
    lastFrame = data;

    // 🔥 kirim ke semua client stream
    clients.forEach((res) => {
      res.write(`--frame\r\n`);
      res.write(`Content-Type: image/jpeg\r\n`);
      res.write(`Content-Length: ${data.length}\r\n\r\n`);
      res.write(data);
      res.write("\r\n");
    });

  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
