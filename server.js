const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = 5500;
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url === '/' ? '/index.html' : req.url;
    reqPath = reqPath.split('?')[0];
    const filePath = path.join(__dirname, reqPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('Dosya bulunamadı: ' + reqPath);
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('Sunucu Hatası: ' + err.code);
        }
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} dolu, ${port + 1} deneniyor...`);
      createServer(port + 1);
    } else {
      console.error('Sunucu hatası:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`\n======================================================`);
    console.log(`  📱 TOPTANCI SATIŞ SİSTEMİ - TABLET VE MOBİL CANLI YAYIN`);
    console.log(`  🌐 Yerel PC: ${url}`);
    console.log(`  📲 Bağlı Cihaz / Tablet (Wi-Fi): http://192.168.1.15:${port}`);
    console.log(`======================================================\n`);

    // Tarayıcıyı bağımsız tablet uygulama penceresi modunda aç
    const chromePath = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`;
    const edgePath = `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`;

    const chromeCmd = `${chromePath} --app="${url}" --window-size=1260,840`;
    const edgeCmd = `${edgePath} --app="${url}" --window-size=1260,840`;

    exec(chromeCmd, (err) => {
      if (err) {
        exec(edgeCmd, (err2) => {
          if (err2) {
            exec(`start ${url}`);
          }
        });
      }
    });
  });
}

createServer(PORT);
