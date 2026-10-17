const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const O = process.argv[2] || path.join(__dirname, '..', 'shots');
const TYP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

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
  const b = await chromium.launch();
  const fehler = [];
  const manifest = JSON.parse(fs.readFileSync(path.join(DOCS, 'firmware', 'manifest.json'), 'utf8'));
  for (const [art, vp] of [['desktop', { width: 1366, height: 900 }], ['handy', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => fehler.push(`${art} pageerror ${e}`));
    p.on('console', (m) => { if (m.type() === 'error') fehler.push(`${art} console ${m.text()}`); });
    p.on('response', (r) => { if (r.status() >= 400) fehler.push(`${art} ${r.status()} ${r.url()}`); });
    for (const s of ['', 'de/', 'es/', 'fr/']) {
      await p.goto(`http://127.0.0.1:8091/SoloBitSafe/${s}flash.html`, { waitUntil: 'networkidle' });
      await p.waitForFunction(() => document.getElementById('flash-version').textContent !== '', null, { timeout: 15000 });
      const z = await p.evaluate(() => ({
        version: document.getElementById('flash-version').textContent,
        frei: !document.getElementById('flash-start').disabled,
        serial: 'serial' in navigator,
        breit: document.documentElement.scrollWidth > window.innerWidth,
        lang: document.documentElement.lang,
      }));
      if (!z.version.includes(manifest.version)) fehler.push(`${art} ${s} Version fehlt`);
      if (z.serial && !z.frei) fehler.push(`${art} ${s} Knopf gesperrt`);
      if (z.breit) fehler.push(`${art} ${s} horizontal zu breit`);
      await p.check('input[value="komplett"]');
      const gesperrt = await p.evaluate(() => document.getElementById('flash-start').disabled && !document.querySelector('.bestaetigen').hidden);
      if (!gesperrt) fehler.push(`${art} ${s} Komplett ohne Bestaetigung frei`);
      const v = await p.evaluate(() => ({
        sichtbar: !document.querySelector('.variante').hidden,
        gehaertetAus: document.querySelector('input[name="variante"][value="gehaertet"]').disabled,
        standard: document.querySelector('input[name="variante"][value="standard"]').checked,
        bald: !document.getElementById('flash-bald').hidden && document.getElementById('flash-bald').textContent.length > 10,
      }));
      if (!v.sichtbar || !v.gehaertetAus || !v.standard || !v.bald) fehler.push(`${art} ${s} Variante falsch ${JSON.stringify(v)}`);
      await p.check('input[value="loeschen"]');
      const l = await p.evaluate(() => ({
        variante: document.querySelector('.variante').hidden,
        best: !document.querySelector('.bestaetigen').hidden,
      }));
      if (!l.variante || !l.best) fehler.push(`${art} ${s} Loeschen ohne Bestaetigung ${JSON.stringify(l)}`);
      await p.check('input[value="komplett"]');
      await p.check('#flash-ok');
      if (z.serial && await p.evaluate(() => document.getElementById('flash-start').disabled)) fehler.push(`${art} ${s} Komplett trotz Bestaetigung gesperrt`);
      if (s === '' && art === 'desktop') {
        const geprueft = await p.evaluate(async () => {
          const k = await import('./flasher-kern.js');
          const e = await import('esptool-js');
          const basis = new URL('firmware/', location.href);
          const m = await (await fetch(new URL('manifest.json', basis))).json();
          const out = {};
          for (const a of ['update', 'komplett', 'gehaertet']) {
            const d = await k.laden(basis, m, a);
            out[a] = d.map((x) => `${x.name}@${x.adresse.toString(16)}:${x.daten.length}`).join(' ');
          }
          const kaputt = { ...m, dateien: { ...m.dateien, app: { ...m.dateien.app, sha256: '00'.repeat(32) } } };
          try { await k.laden(basis, kaputt, 'update'); out.kaputt = 'nicht erkannt'; } catch (x) { out.kaputt = x.code; }
          out.esptool = typeof e.ESPLoader;
          return out;
        });
        console.log('laden', JSON.stringify(geprueft));
        if (geprueft.kaputt !== 'pruefsumme' || geprueft.esptool !== 'function') fehler.push('Pruefsumme/esptool-js fehlerhaft');
      }
      await p.check('input[value="update"]');
      if (!(await p.evaluate(() => getComputedStyle(document.querySelector('.bestaetigen')).display === 'none'))) fehler.push(`${art} ${s} Bestaetigung bei Update sichtbar`);
      await p.screenshot({ path: path.join(O, `flash-${art}-${s.replace('/', '') || 'en'}.png`), fullPage: true });
      console.log(art, s || 'en/', JSON.stringify(z));
    }
    await p.close();
  }
  {
    const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
    p.on('pageerror', (e) => fehler.push(`haerten pageerror ${e}`));
    await p.route('**/firmware/manifest.json', async (r) => {
      const m = JSON.parse(fs.readFileSync(path.join(DOCS, 'firmware', 'manifest.json'), 'utf8'));
      m.gehaertet_freigegeben = true;
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m) });
    });
    await p.goto('http://127.0.0.1:8091/SoloBitSafe/flash.html', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.getElementById('flash-version').textContent !== '');
    await p.check('input[value="komplett"]');
    await p.check('input[name="variante"][value="gehaertet"]');
    const zustand = () => p.evaluate(() => ({
      zweite: !document.querySelector('.bestaetigen-haerten').hidden,
      gesperrt: document.getElementById('flash-start').disabled,
    }));
    const a1 = await zustand();
    await p.check('#flash-ok');
    const a2 = await zustand();
    await p.check('#flash-haerten-ok');
    const a3 = await zustand();
    await p.check('input[name="variante"][value="standard"]');
    const a4 = await zustand();
    console.log('haerten', JSON.stringify([a1, a2, a3, a4]));
    if (!a1.zweite || !a1.gesperrt || !a2.gesperrt || a3.gesperrt || a4.zweite) fehler.push('Haerten-Bestaetigung falsch');
    await p.close();
  }
  await b.close();
  server.close();
  console.log(fehler.length ? 'FEHLER\n' + fehler.join('\n') : 'alles gruen');
  process.exit(fehler.length ? 1 : 0);
})();
