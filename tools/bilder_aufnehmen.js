const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DESIGN = process.argv[2] || path.join(os.homedir(), 'Desktop', 'SoloBitSafe-Design-Export');
const DASH = process.argv[3] || path.join(os.homedir(), 'Desktop', 'SoloBitSafe-Dashboard-Export');
const ZIEL = process.argv[4] || path.join(__dirname, '..', 'roh');
const SPR = ['en', 'de', 'es', 'fr'];

const APP = { uebersicht: '05-uebersicht', empfangen: '06-empfangen', senden: '07-senden', verlauf: '11-verlauf', geraet: '17-geraet' };
const WEB = { gesperrt: 'gesperrt-wallet', 'offen-1': 'offen-wallet', 'offen-2': 'offen-contacts', 'offen-3': 'offen-psbt', 'offen-4': 'offen-app' };
const DISPLAY = { '0-start': '44', '1-mining': '10', '2-netzwerk': '25', '3a-wallet-gesperrt': '01', '3b-wallet-entsperrt': '02', '4a-beleg-kontakt': '03' };

const datei = (p) => 'file:///' + p.split(path.sep).join('/');

async function aufnahme(b, quelle, ziel, vp, faktor, auswahl) {
  if (!fs.existsSync(quelle)) throw new Error(`fehlt: ${quelle}`);
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: faktor });
  const p = await ctx.newPage();
  await p.goto(datei(quelle));
  await p.waitForTimeout(400);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  if (auswahl) await p.locator(auswahl).screenshot({ path: ziel });
  else await p.screenshot({ path: ziel });
  await ctx.close();
}

(async () => {
  const b = await chromium.launch();
  let n = 0;
  try {
    for (const s of SPR) {
      for (const [name, seite] of Object.entries(APP)) {
        await aufnahme(b, path.join(DESIGN, 'app', 'android', s, `${seite}.html`), path.join(ZIEL, 'vorschau', s, `app-handy-${name}.png`), { width: 412, height: 900 }, 2);
        await aufnahme(b, path.join(DESIGN, 'app', 'windows', s, `${seite}.html`), path.join(ZIEL, 'vorschau', s, `app-desktop-${name}.png`), { width: 1280, height: 800 }, 1);
        n += 2;
      }
      for (const [name, seite] of Object.entries(WEB)) {
        await aufnahme(b, path.join(DASH, 'wallet', s, `${seite}-desktop.html`), path.join(ZIEL, 'vorschau', s, `web-desktop-${name}.png`), { width: 1280, height: 800 }, 1);
        await aufnahme(b, path.join(DASH, 'wallet', s, `${seite}-phone.html`), path.join(ZIEL, 'vorschau', s, `web-handy-${name}.png`), { width: 412, height: 900 }, 2);
        n += 2;
      }
      for (const [name, seite] of Object.entries(DISPLAY)) {
        await aufnahme(b, path.join(DESIGN, 'display', s, `${seite}.html`), path.join(ZIEL, 'display', s, `${name}.png`), { width: 400, height: 250 }, 3, '.display');
        n++;
      }
    }
  } finally {
    await b.close();
  }
  console.log(`${n} Bilder -> ${ZIEL}`);
})().catch((e) => { console.error(e); process.exit(1); });
