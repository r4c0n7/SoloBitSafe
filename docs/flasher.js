import { ESPLoader, Transport } from "esptool-js";
import { flashen, laden, FlashFehler } from "./flasher-kern.js";

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

function freigeben() {
  const komplett = art() === "komplett";
  bestaetigen.hidden = !komplett;
  knopf.disabled = laeuft || !manifest || !("serial" in navigator) || (komplett && !ok.checked);
}

const terminal = {
  clean() {},
  writeLine: (t) => log(t),
  write: (t) => { protokoll.textContent += t; },
};

async function portSuchen() {
  for (let i = 0; i < 30; i++) {
    const ports = (await navigator.serial.getPorts()).filter((p) => p.getInfo().usbVendorId === VID);
    if (ports.length) return ports[0];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new FlashFehler("verbinden_fehler");
}

async function verbinden() {
  let letzter;
  for (let v = 0; v < 3; v++) {
    try {
      if (!port || v > 0) port = await portSuchen();
      const loader = new ESPLoader({ transport: new Transport(port), baudrate: 115200, terminal });
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
      try { await port.close(); } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new FlashFehler("verbinden_fehler", String(letzter?.message || letzter));
}

async function trennen(loader) {
  if (loader) await loader.transport.disconnect();
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
    melden("laden");
    let dateien;
    try {
      dateien = await laden(basis, manifest, art());
    } catch (e) {
      throw e instanceof FlashFehler && e.code === "pruefsumme" ? e : new FlashFehler("laden_fehler");
    }
    melden("verbinden");
    balken.parentElement.hidden = false;
    await flashen({
      verbinden,
      trennen,
      dateien,
      art: art(),
      log: (t) => {
        log(t);
        if (t.startsWith("sicherheit")) melden(t.includes("verschluesselt=true") || t.includes("sdm=true") ? "sicher" : "offen");
      },
      fortschritt: (a, g) => { balken.style.width = `${Math.floor((a * 100) / g)}%`; },
    });
    melden("fertig", { v: manifest.version });
  } catch (e) {
    const code = e instanceof FlashFehler ? e.code : null;
    if (!code) log(String(e.stack || e));
    melden(code && texte.m[code] ? code : "allgemein", { m: e.message || String(e) }, true);
  } finally {
    laeuft = false;
    freigeben();
  }
}

document.querySelectorAll('input[name="art"]').forEach((r) => r.addEventListener("change", freigeben));
ok.addEventListener("change", freigeben);
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
