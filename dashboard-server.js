// dashboard-server.js
// Jalanin BARENGAN sama screen.js (proses terpisah), baca file JSON yang sama.
//   node dashboard-server.js
// lalu buka http://localhost:4545 di browser.
//
// Gak perlu ubah screen.js buat nambah HTTP server di dalamnya — ini sengaja
// dipisah biar kalau dashboard-nya crash/di-restart, gak ganggu proses trading.

const http = require('http');
const fs = require('fs');
const path = require('path');

// Parser .env manual (biar file ini gak butuh install package tambahan).
// Cuma perlu tau AUTO_BUY_DRY_RUN buat nampilin status LIVE/DRY RUN di dashboard.
function loadEnvDryRun() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = raw.match(/^AUTO_BUY_DRY_RUN\s*=\s*(\S+)/m);
    if (m) return m[1].replace(/["']/g, '').trim() !== 'false';
  } catch {}
  return true; // default aman: anggap dry run kalau .env gak ketemu/gak ada field-nya
}

const PORT = Number(process.env.DASHBOARD_PORT) || 4545;

const DIR             = __dirname;
const POSITIONS_FILE  = path.join(DIR, 'positions.json');
const TRACKING_LOG    = path.join(DIR, 'tracking_log.json');
const DASHBOARD_HTML  = path.join(DIR, 'dashboard.html');

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function buildState() {
  const posData = readJsonSafe(POSITIONS_FILE, { entries: {} });
  const events   = readJsonSafe(TRACKING_LOG, []);

  // positions.json nyimpen { entries: { [ca]: posObject } } — CA-nya jadi key,
  // dashboard butuh ca ada DI DALAM tiap object, bukan cuma jadi key map.
  const positions = Object.entries(posData.entries || {}).map(([ca, pos]) => ({
    ca,
    ...pos,
  }));

  const boughtPositions = positions.filter(p => p.bought).length;

  // telegramMode: baca dari .env biar match sama mode screen.js yang lagi jalan.
  const dryRun = loadEnvDryRun();
  const telegramMode = dryRun ? 'DRY RUN' : 'LIVE';

  return {
    updatedAt: Date.now(),
    stats: {
      activePositions: positions.length,
      boughtPositions,
      alertCount: 0,       // NOTIF_ONLY_AUTO aktif -> gak ada alert screening lokal
      eventCount: events.length,
      telegramMode,
    },
    positions,
    events,
    alerts: [],            // sengaja kosong, sesuai setup NOTIF_ONLY_AUTO=true
  };
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/state') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(buildState()));
    return;
  }

  if (url === '/' || url === '/dashboard.html') {
    fs.readFile(DASHBOARD_HTML, 'utf8', (err, html) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('dashboard.html gak ketemu di folder ini. Taruh file dashboard.html di sebelah dashboard-server.js.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[DASHBOARD] Jalan di http://localhost:${PORT}`);
  console.log(`[DASHBOARD] Baca data dari: ${POSITIONS_FILE}`);
  console.log(`[DASHBOARD] Baca data dari: ${TRACKING_LOG}`);
});
