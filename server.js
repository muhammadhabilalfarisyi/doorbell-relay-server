const http = require("http");
const WebSocket = require("ws");

// ================= SERVER HTTP =================
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
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

  } else {
    res.writeHead(200);
    res.end("MJPEG Stream Server is Running...");
  }
});

// ================= WEBSOCKET =================
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
  console.log("ESP32 / Client connected");

  ws.on("message", (data) => {

    // Kirim frame ke semua client HTTP (MJPEG)
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
