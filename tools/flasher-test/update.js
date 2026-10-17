import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { SerialPort } from "serialport";
import { ESPLoader, Transport } from "esptool-js";
import { flashen, laden, loeschen, pepperEinrichten } from "../../docs/flasher-kern.js";

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
    const sp = new SerialPort({ path: this.pfad, baudRate, autoOpen: false, lock: false });
    await new Promise((ok, fehler) => sp.open((e) => (e ? fehler(e) : ok())));
    this.sp = sp;
    this.helfer = spawn("python3", [new URL("./signale.py", import.meta.url).pathname, this.pfad], { stdio: ["pipe", "pipe", "inherit"] });
    this.antworten = createInterface({ input: this.helfer.stdout })[Symbol.asyncIterator]();
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
    this.helfer.stdin.write(`${this.signale.dtr ? 1 : 0} ${this.signale.rts ? 1 : 0}
`);
    const { value } = await this.antworten.next();
    if (value !== "ok") throw new Error("Signale nicht gesetzt");
  }

  async close() {
    const sp = this.sp;
    if (this.helfer) this.helfer.kill();
    this.helfer = null;
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
if (art === "pepper") {
  const ok = await pepperEinrichten({ port: new NodePort(pfad()), start: 0, befehlNach: Number(process.argv[4] || 25000), log: (t) => console.log("  " + t), melden: (t) => console.log("  > " + t) });
  console.log("pepper fertig", ok);
  process.exit(0);
}
if (art.startsWith("loeschen")) {
  const nur = process.argv[4];
  const bereiche = manifest.bereiche.filter((b) => !nur || b.name === nur);
  console.log(`${art}: ${bereiche.map((b) => `${b.name}@0x${b.adresse.toString(16)}+0x${b.groesse.toString(16)}`).join(" ")}`);
  const beginn = Date.now();
  const s = await loeschen({ verbinden, trennen, bereiche, log: (t) => console.log("  " + t) });
  console.log(`fertig in ${Math.round((Date.now() - beginn) / 1000)} s`, JSON.stringify(s));
  process.exit(0);
}
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
