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
}).listen(8090);

(async () => {
  fs.mkdirSync(O, { recursive: true });
  const b = await chromium.launch();
  const fehler = [];
  for (const [art, vp] of [['desktop', { width: 1366, height: 900 }], ['handy', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => fehler.push(String(e)));
    p.on('response', (r) => { if (r.status() >= 400) fehler.push(r.status() + ' ' + r.url()); });
    for (const s of ['', 'de/']) {
      await p.goto(`http://127.0.0.1:8090/SoloBitSafe/${s}`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      const breit = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (breit) fehler.push(`${art} ${s}: horizontal scroll`);
      await p.screenshot({ path: `${O}/${art}-${s.replace('/', '') || 'en'}.png`, fullPage: true });
      await p.screenshot({ path: `${O}/${art}-${s.replace('/', '') || 'en'}-oben.png` });
    }
    await p.goto('http://127.0.0.1:8090/SoloBitSafe/de/guide.html', { waitUntil: 'networkidle' });
    if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) fehler.push(art + ' guide: horizontal scroll');
    await p.screenshot({ path: `${O}/${art}-de-guide.png`, fullPage: true });
    await p.goto('http://127.0.0.1:8090/SoloBitSafe/fr/changelog.html', { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${O}/${art}-fr-changelog.png`, fullPage: true });
    const links = await p.$$eval('a[href]', (a) => a.map((x) => x.href).filter((h) => h.startsWith('http://127.0.0.1')));
    for (const l of [...new Set(links)]) {
      const r = await p.request.get(l.split('#')[0]);
      if (r.status() >= 400) fehler.push('Link ' + r.status() + ' ' + l);
    }
    await p.close();
  }
  await b.close();
  server.close();
  console.log(fehler.length ? fehler.join('\n') : 'keine Fehler');
})();
