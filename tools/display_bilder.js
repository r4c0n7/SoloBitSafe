const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REPO = process.argv[2] || path.join(__dirname, '..', '..', 'BitGo-LuckyWallet');
const ZIEL = process.argv[3] || path.join(__dirname, '..', 'roh', 'display');
const VORLAGEN = path.join(REPO, 'docs', 'design', 'solobitsafe', 'display');
const SEITEN = ['0-start', '1-mining', '2-netzwerk', '3a-wallet-gesperrt', '3b-wallet-entsperrt', '4a-beleg-kontakt'];
const SPR = ['en', 'de', 'es', 'fr'];

const tx = {};
for (const z of fs.readFileSync(path.join(REPO, 'src', 'wallet', 'display_texte.def'), 'utf8').split('\n')) {
  const m = z.match(/^TX\((\w+), (.*)\)\s*$/);
  if (m) tx[m[1]] = [...m[2].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}
const k = (key, f) => SPR.map((_, i) => (f ? f(tx[key][i], i) : tx[key][i]));
const datum = (i) => `${tx.TagDo[i]} ${tx.DatumKurzFmt[i].replace('%02d', '08').replace('%02d', '10')}`;

const ersetzen = {
  'Do 08.10.': SPR.map((_, i) => datum(i)),
  'UHRZEIT': k('Uhrzeit'),
  'WALLET': k('Wallet'),
  '412.800 sat · ≈ 300,52 €': ['412,800 sat · ≈ $347.20', '412.800 sat · ≈ 300,52 €', '412.800 sat · ≈ 300,52 €', '412 800 sat · ≈ 300,52 €'],
  'seit Start': k('SeitStart'),
  'BLÖCKE': k('Bloecke'),
  'BLOCKHÖHE': k('Blockhoehe'),
  '80,384 Blöcke · ~558 T': SPR.map((_, i) => `80,384${tx.BloeckeKurz[i]} · ~558${tx.TageKurz[i]}`),
  'NETZ-HASH': k('NetzHash'),
  'DIFFICULTY': k('Difficulty'),
  'GEBÜHR': k('GebuehrKachel'),
  'GESPERRT': k('Gesperrt'),
  'EMPFANGSADRESSE': k('Empfangsadresse'),
  'GUTHABEN VERBORGEN': k('Guthaben'),
  'Im Dashboard entsperren': ['412,800 sat', '412.800 Sat', '412.800 sat', '412 800 sat'],
  'ENTSPERRT 4:32': k('EntsperrtFmt', (t) => t.replace('%s', '4:32')),
  'GUTHABEN': k('Guthaben'),
  '412.800 Sat': ['412,800 sat', '412.800 Sat', '412.800 sat', '412 800 sat'],
  '≈ 300,52 €': ['≈ $347.20', '≈ 300,52 €', '≈ 300,52 €', '≈ 300,52 €'],
  'pausiert': k('Pausiert'),
  'LETZTE TX': k('LetzteTx'),
  '+2.100': ['+2,100', '+2.100', '+2.100', '+2 100'],
  'SENDEN?': k('SendenFrage'),
  'PRÜFEN IM BROWSER': k('AmGeraetBestaetigen'),
  '≈ 182,00 €': ['≈ $210.40', '≈ 182,00 €', '≈ 182,00 €', '≈ 182,00 €'],
  'Kontakt:': k('KontaktDoppelpunkt'),
  'Exodus Hauptwallet': ['Exodus main wallet', 'Exodus Hauptwallet', 'Exodus principal', 'Exodus principal'],
  'Gebühr': k('Gebuehr'),
  '1.410 Sat': ['1,410 sat', '1.410 Sat', '1.410 sat', '1 410 sat'],
  'Bestätigung im Browser': SPR.map((_, i) => `BTN1 ${tx.Signieren[i]} · ${tx.Btn2Nein[i]}`),
};

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ deviceScaleFactor: 3, viewport: { width: 340, height: 190 } });
  for (const seite of SEITEN) {
    const html = fs.readFileSync(path.join(VORLAGEN, seite, `${seite}.html`), 'utf8');
    for (let i = 0; i < SPR.length; i++) {
      let h = html.replace('<html lang="de">', `<html lang="${SPR[i]}">`);
      for (const [alt, neu] of Object.entries(ersetzen)) {
        const esc = alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        h = h.replace(new RegExp(`>(\\s*)${esc}(\\s*)<`, 'g'), (_, a, z) => `>${a}${neu[i]}${z}<`);
      }
      await p.setContent(h, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      const ziel = path.join(ZIEL, SPR[i]);
      fs.mkdirSync(ziel, { recursive: true });
      await p.locator('#screen').screenshot({ path: path.join(ziel, `${seite}.png`) });
      const rest = await p.evaluate(() => document.body.innerText);
      const deutsch = ['UHRZEIT', 'GESPERRT', 'GUTHABEN', 'Gebühr', 'Browser', 'Blöcke', 'pausiert'].filter((w) => SPR[i] !== 'de' && rest.includes(w));
      if (deutsch.length) console.log(`HINWEIS ${seite} ${SPR[i]}: noch deutsch: ${deutsch.join(', ')}`);
    }
  }
  await browser.close();
  console.log('fertig', ZIEL);
})();
