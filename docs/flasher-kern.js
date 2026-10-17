export const ABSCHNITT = 0x50000;
const ROM_BLOCK = 0x400;
const SPI_SET_PARAMS = 0x0b;
const FLASH_GROESSE = 16 * 1024 * 1024;
const RTC = 0x60008000;
const WDT_SCHLUESSEL = 0x50d83aa1;
const SWD_SCHLUESSEL = 0x8f1d312a;

export class FlashFehler extends Error {
  constructor(code, text) {
    super(text || code);
    this.code = code;
  }
}

export function plan(manifest, art) {
  const namen = manifest.ablaeufe[art];
  if (!namen) throw new FlashFehler("art", art);
  return namen.map((name) => ({ name, ...manifest.dateien[name] }));
}

export async function pruefsumme(daten) {
  const h = await crypto.subtle.digest("SHA-256", daten);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function laden(basis, manifest, art, holen = fetch) {
  const dateien = [];
  for (const d of plan(manifest, art)) {
    const antwort = await holen(new URL(d.pfad, basis));
    if (!antwort.ok) throw new FlashFehler("laden", d.pfad);
    const daten = new Uint8Array(await antwort.arrayBuffer());
    if (daten.length !== d.groesse || (await pruefsumme(daten)) !== d.sha256) throw new FlashFehler("pruefsumme", d.pfad);
    dateien.push({ ...d, daten });
  }
  return dateien;
}

function bits(n) {
  let z = 0;
  for (; n; n >>= 1) z += n & 1;
  return z;
}

export async function sicherheit(loader) {
  const info = await loader.getSecurityInfo(false);
  return {
    sdm: info.parsedFlags.SECURE_DOWNLOAD_ENABLE,
    secureBoot: info.parsedFlags.SECURE_BOOT_EN,
    verschluesselt: bits(info.flashCryptCnt & 0x7) % 2 === 1,
  };
}

function worte(...w) {
  const pkt = new Uint8Array(w.length * 4);
  const v = new DataView(pkt.buffer);
  w.forEach((x, i) => v.setUint32(i * 4, x >>> 0, true));
  return pkt;
}

export async function romVorbereiten(loader) {
  loader.FLASH_WRITE_SIZE = ROM_BLOCK;
  await loader.flashSpiAttach(0);
  await loader.checkCommand("set SPI params", SPI_SET_PARAMS, worte(0, FLASH_GROESSE, 0x10000, 0x1000, 0x100, 0xffff));
}

async function watchdogAus(loader) {
  await loader.writeReg(RTC + 0xb0, WDT_SCHLUESSEL);
  await loader.writeReg(RTC + 0x98, 0);
  await loader.writeReg(RTC + 0xb0, 0);
  await loader.writeReg(RTC + 0xb8, SWD_SCHLUESSEL);
  await loader.writeReg(RTC + 0xb4, ((await loader.readReg(RTC + 0xb4)) | 0x80000000) >>> 0);
  await loader.writeReg(RTC + 0xb8, 0);
}

async function stueckSchreiben(loader, daten, adresse, verschluesselt, weiter) {
  const groesse = loader.FLASH_WRITE_SIZE;
  const bloecke = Math.ceil(daten.length / groesse);
  const zeit = loader.timeoutPerMb(loader.ERASE_REGION_TIMEOUT_PER_MB, daten.length);
  await loader.checkCommand("enter Flash download mode", loader.ESP_FLASH_BEGIN,
    worte(daten.length, bloecke, groesse, adresse, verschluesselt ? 1 : 0), 0, 0, zeit);
  for (let seq = 0; seq < bloecke; seq++) {
    const block = new Uint8Array(groesse).fill(0xff);
    block.set(daten.subarray(seq * groesse, (seq + 1) * groesse));
    await loader.flashBlock(block, seq, loader.timeoutPerMb(loader.ERASE_WRITE_TIMEOUT_PER_MB, groesse));
    weiter(Math.min(groesse, daten.length - seq * groesse));
  }
}

function stuecke(dateien) {
  const liste = [];
  for (const d of dateien) {
    for (let o = 0; o < d.daten.length; o += ABSCHNITT) {
      liste.push({ name: d.name, adresse: d.adresse + o, daten: d.daten.subarray(o, o + ABSCHNITT) });
    }
  }
  return liste;
}

export async function flashen({ verbinden, trennen, dateien, art, log = () => {}, fortschritt = () => {}, warten, versuche = 3 }) {
  const gesamt = dateien.reduce((s, d) => s + d.daten.length, 0);
  let fertig = 0;
  const pause = warten || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let loader = await verbinden();
  const s = await sicherheit(loader);
  log(`sicherheit sdm=${s.sdm} secureBoot=${s.secureBoot} verschluesselt=${s.verschluesselt}`);

  if (!s.sdm && !s.secureBoot && !s.verschluesselt) {
    await watchdogAus(loader);
    await loader.writeFlash({
      fileArray: dateien.map((d) => ({ data: d.daten, address: d.adresse })),
      flashMode: "keep", flashFreq: "keep", flashSize: "keep",
      eraseAll: art === "komplett", compress: true,
      reportProgress: (i, geschrieben, summe) => {
        const vorher = dateien.slice(0, i).reduce((x, d) => x + d.daten.length, 0);
        fortschritt(vorher + Math.round((dateien[i].daten.length * geschrieben) / Math.max(1, summe)), gesamt);
      },
    });
    fortschritt(gesamt, gesamt);
    await loader.after("hard_reset");
    await trennen(loader);
    return s;
  }

  if (art !== "update") {
    await trennen(loader);
    throw new FlashFehler("komplett-gesperrt");
  }
  const liste = stuecke(dateien);
  for (let i = 0; i < liste.length; i++) {
    const st = liste[i];
    for (let v = 1; ; v++) {
      try {
        if (!loader) loader = await verbinden();
        await romVorbereiten(loader);
        let hier = 0;
        await stueckSchreiben(loader, st.daten, st.adresse, s.verschluesselt, (n) => {
          hier += n;
          fortschritt(fertig + hier, gesamt);
        });
        fertig += st.daten.length;
        log(`${st.name} 0x${st.adresse.toString(16)} ${st.daten.length} ok`);
        break;
      } catch (e) {
        log(`${st.name} 0x${st.adresse.toString(16)} Versuch ${v}: ${e.message || e}`);
        fortschritt(fertig, gesamt);
        if (v >= versuche) {
          if (loader) await trennen(loader).catch(() => {});
          throw new FlashFehler("schreiben", `0x${st.adresse.toString(16)}`);
        }
      }
      await trennen(loader).catch(() => {});
      loader = null;
      await pause(4000);
    }
    if (i < liste.length - 1) {
      await trennen(loader).catch(() => {});
      loader = null;
      await pause(4000);
    }
  }
  await loader.after("hard_reset").catch(() => {});
  await trennen(loader).catch(() => {});
  return s;
}
