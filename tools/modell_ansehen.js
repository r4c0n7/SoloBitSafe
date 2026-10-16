const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const O = process.argv[2] || path.join(__dirname, '..', 'shots');
const TYP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/SoloBitSafe/, '');
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DOCS, p);
  if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
}).listen(8091);

(async () => {
  fs.mkdirSync(O, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const fehler = [];
  for (const [art, vp, s] of [['desktop', { width: 1366, height: 900 }, ''], ['handy', { width: 390, height: 844 }, 'fr/']]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => fehler.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
    await p.goto(`http://127.0.0.1:8091/SoloBitSafe/${s}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(6000);
    const mit3d = await p.evaluate(() => document.querySelector('.geraet').classList.contains('mit-3d'));
    console.log(art, '3D aktiv:', mit3d);
    await p.locator('.geraet').screenshot({ path: `${O}/modell-${art}.png` });
    await p.waitForTimeout(6500);
    await p.locator('.geraet').screenshot({ path: `${O}/modell-${art}-2.png` });
    await p.close();
  }
  await b.close();
  server.close();
  console.log(fehler.length ? fehler.join('\n') : 'keine Fehler');
})();
