import { readFileSync, readdirSync, existsSync } from "node:fs";
import { SerialPort } from "serialport";
import { ESPLoader, Transport } from "esptool-js";
import { flashen, laden } from "../../docs/flasher-kern.js";

class NodePort {
  constructor(pfad) {
    this.pfad = pfad;
    this.readable = null;
    this.writable = null;
    this.signale = { dtr: false, rts: false, brk: false };
  }

  getInfo() {
    return { usbVendorId: 0x303a, usbProductId: 0x1001 };
  }

  async open({ baudRate }) {
    const sp = new SerialPort({ path: this.pfad, baudRate, autoOpen: false });
    await new Promise((ok, fehler) => sp.open((e) => (e ? fehler(e) : ok())));
    this.sp = sp;
    this.readable = new ReadableStream({
      start(c) {
        sp.on("data", (d) => { try { c.enqueue(new Uint8Array(d)); } catch {} });
        sp.on("close", () => { try { c.close(); } catch {} });
        sp.on("error", (e) => { try { c.error(e); } catch {} });
      },
    });
    this.writable = new WritableStream({
      write(teil) {
        return new Promise((ok, fehler) => sp.write(Buffer.from(teil), (e) => (e ? fehler(e) : sp.drain(ok))));
      },
    });
  }

  async setSignals(s) {
    if (s.dataTerminalReady !== undefined) this.signale.dtr = s.dataTerminalReady;
    if (s.requestToSend !== undefined) this.signale.rts = s.requestToSend;
    if (s.break !== undefined) this.signale.brk = s.break;
    await new Promise((ok, fehler) => this.sp.set({ ...this.signale }, (e) => (e ? fehler(e) : ok())));
  }

  async close() {
    const sp = this.sp;
    this.readable = null;
    this.writable = null;
    if (sp && sp.isOpen) await new Promise((ok) => sp.close(() => ok()));
  }
}

function pfad() {
  const d = "/dev/serial/by-id";
  const p = existsSync(d) ? readdirSync(d).find((n) => n.startsWith("usb-Espressif")) : null;
  return p ? `${d}/${p}` : "/dev/ttyACM0";
}

const schweigen = { clean() {}, writeLine() {}, write() {} };

async function verbinden() {
  for (let i = 0; i < 15 && !existsSync(pfad()); i++) await new Promise((r) => setTimeout(r, 1000));
  const transport = new Transport(new NodePort(pfad()));
  const loader = new ESPLoader({ transport, baudrate: 115200, terminal: schweigen });
  await loader.main("default_reset");
  return loader;
}

async function trennen(loader) {
  if (loader) await loader.transport.disconnect();
}

const ordner = process.argv[2] || "../../docs/firmware";
const art = process.argv[3] || "update";
const manifest = JSON.parse(readFileSync(`${ordner}/manifest.json`, "utf8"));
const holen = async (url) => {
  const daten = readFileSync(new URL(url).pathname.replace(/^\/basis\//, `${ordner}/`));
  return { ok: true, arrayBuffer: async () => daten.buffer.slice(daten.byteOffset, daten.byteOffset + daten.length) };
};
const dateien = await laden("file:///basis/", manifest, art, holen);
console.log(`${manifest.version} ${art}: ${dateien.map((d) => `${d.name}@0x${d.adresse.toString(16)}`).join(" ")}`);
let letzte = -1;
const beginn = Date.now();
const s = await flashen({
  verbinden, trennen, dateien, art,
  log: (t) => console.log("  " + t),
  fortschritt: (a, g) => {
    const p = Math.floor((a * 10) / g);
    if (p !== letzte) { letzte = p; console.log(`  ${p * 10} %`); }
  },
});
console.log(`fertig in ${Math.round((Date.now() - beginn) / 1000)} s`, JSON.stringify(s));
process.exit(0);
