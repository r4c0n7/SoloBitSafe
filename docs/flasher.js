import { ESPLoader, Transport } from "esptool-js";
import { flashen, laden, loeschen, pepperEinrichten, startAbwarten, FlashFehler } from "./flasher-kern.js";

const VID = 0x303a;
const bereich = document.querySelector(".flasher");
const texte = JSON.parse(document.getElementById("flash-texte").textContent);
const knopf = document.getElementById("flash-start");
const ok = document.getElementById("flash-ok");
const bestaetigen = document.querySelector(".bestaetigen");
const status = document.getElementById("flash-status");
const protokoll = document.getElementById("flash-log");
const balken = document.getElementById("flash-balken");
const basis = new URL(bereich.dataset.firmware, location.href);
let manifest = null;
let port = null;
let laeuft = false;

const m = (k, werte = {}) => (texte.m[k] || k).replace(/\{(\w+)\}/g, (_, n) => werte[n] ?? "");
const melden = (k, werte, fehler = false) => {
  status.textContent = m(k, werte);
  status.classList.toggle("fehler", fehler);
};
const log = (t) => {
  protokoll.textContent += t + "\n";
  protokoll.scrollTop = protokoll.scrollHeight;
};
const art = () => document.querySelector('input[name="art"]:checked').value;
const variante = () => document.querySelector('input[name="variante"]:checked').value;
const variantenFeld = document.querySelector(".variante");
const gehaertetWahl = document.querySelector('input[name="variante"][value="gehaertet"]');
const bald = document.getElementById("flash-bald");
const haertenBest = document.querySelector(".bestaetigen-haerten");
const haertenOk = document.getElementById("flash-haerten-ok");

function freigeben() {
  const a = art();
  const gefaehrlich = a === "komplett" || a === "loeschen";
  variantenFeld.hidden = a !== "komplett";
  const haerten = a === "komplett" && variante() === "gehaertet";
  haertenBest.hidden = !haerten;
  const gehaertetFrei = !!manifest?.gehaertet_freigegeben;
  gehaertetWahl.disabled = !gehaertetFrei;
  bald.hidden = gehaertetFrei;
  bald.textContent = texte.bald;
  if (!gehaertetFrei && gehaertetWahl.checked) document.querySelector('input[name="variante"][value="standard"]').checked = true;
  bestaetigen.hidden = !gefaehrlich;
  knopf.disabled = laeuft || !manifest || !("serial" in navigator) || (gefaehrlich && !ok.checked) || (haerten && !haertenOk.checked);
}

const terminal = {
  clean() {},
  writeLine: (t) => log(t),
  write: (t) => { protokoll.textContent += t; },
};

async function portSuchen() {
  for (let i = 0; i < 30; i++) {
    const ports = (await navigator.serial.getPorts()).filter((p) => p.getInfo().usbVendorId === VID);
    if (ports.length) return ports[ports.length - 1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new FlashFehler("verbinden_fehler");
}

const schlafen = (ms) => new Promise((r) => setTimeout(r, ms));
const hoechstens = (versprechen, ms) => Promise.race([versprechen, schlafen(ms)]);

async function verbinden() {
  let letzter;
  for (let v = 0; v < 3; v++) {
    let transport;
    try {
      port = await portSuchen();
      transport = new Transport(port);
      const loader = new ESPLoader({ transport, baudrate: 115200, terminal });
      await loader.main("default_reset");
      if (loader.chip.CHIP_NAME !== "ESP32-S3") {
        await loader.transport.disconnect();
        throw new FlashFehler("chip");
      }
      return loader;
    } catch (e) {
      if (e instanceof FlashFehler) throw e;
      letzter = e;
      log(String(e.message || e));
      try { await hoechstens(transport ? transport.disconnect() : port.close(), 3000); } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new FlashFehler("verbinden_fehler", String(letzter?.message || letzter));
}

async function trennen(loader) {
  if (loader) await hoechstens(loader.transport.disconnect(), 3000);
}

async function starten() {
  laeuft = true;
  freigeben();
  protokoll.textContent = "";
  balken.style.width = "0";
  balken.parentElement.hidden = true;
  try {
    melden("waehlen");
    try {
      port = await navigator.serial.requestPort({ filters: [{ usbVendorId: VID }] });
    } catch {
      throw new FlashFehler("abgebrochen");
    }
    const a = art();
    const ablauf = a === "komplett" ? (variante() === "gehaertet" ? "gehaertet" : "komplett") : a;
    const fortschritt = (x, g) => { balken.style.width = `${Math.floor((x * 100) / g)}%`; };
    if (ablauf === "loeschen") {
      melden("verbinden");
      balken.parentElement.hidden = false;
      try {
        await loeschen({ verbinden, trennen, bereiche: manifest.bereiche, log, fortschritt });
      } catch (e) {
        throw e instanceof FlashFehler && e.code === "loeschen" ? new FlashFehler("loeschen_fehler") : e;
      }
      melden("geloescht");
      return;
    }
    melden("laden");
    const holen = async (welcher) => {
      try {
        return await laden(basis, manifest, welcher);
      } catch (e) {
        throw e instanceof FlashFehler && e.code === "pruefsumme" ? e : new FlashFehler("laden_fehler");
      }
    };
    const stufen = ablauf === "gehaertet" ? ["komplett", "gehaertet"] : [ablauf];
    const saetze = [];
    for (const st of stufen) saetze.push(await holen(st));
    balken.parentElement.hidden = false;
    for (let i = 0; i < stufen.length; i++) {
      melden(stufen[i] === "gehaertet" ? "haerten" : "verbinden");
      balken.style.width = "0";
      await flashen({
        verbinden,
        trennen,
        dateien: saetze[i],
        art: stufen[i],
        log: (t) => {
          log(t);
          if (t.startsWith("sicherheit") && stufen[i] !== "gehaertet") melden(t.includes("verschluesselt=true") || t.includes("sdm=true") ? "sicher" : "offen");
        },
        fortschritt,
      });
      if (stufen[i] === "gehaertet") {
        melden("erststart");
        await startAbwarten({ port, log });
        melden("gehaertet_ok", { v: manifest.version });
        return;
      }
      melden("pepper_warte");
      await pepperEinrichten({ port, log, melden: (k) => melden(k) });
    }
    melden(ablauf === "gehaertet" ? "erststart" : "fertig", { v: manifest.version });
  } catch (e) {
    const code = e instanceof FlashFehler ? e.code : null;
    if (!code) log(String(e.stack || e));
    melden(code && texte.m[code] ? code : "allgemein", { m: e.message || String(e) }, true);
  } finally {
    laeuft = false;
    freigeben();
  }
}

document.querySelectorAll('input[name="art"], input[name="variante"]').forEach((r) => r.addEventListener("change", freigeben));
ok.addEventListener("change", freigeben);
haertenOk.addEventListener("change", freigeben);
knopf.addEventListener("click", starten);

if (!("serial" in navigator)) melden("kein_serial", {}, true);
fetch(new URL("manifest.json", basis))
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
  .then((j) => {
    manifest = j;
    document.getElementById("flash-version").textContent = texte.version.replace("{v}", j.version);
    freigeben();
  })
  .catch(() => melden("laden_fehler", {}, true));
