import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const DOCS = path.resolve(process.argv[2] || "../../docs");
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome`;
const TYP = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(DOCS, p);
  if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYP[path.extname(f)] || "application/octet-stream" });
  res.end(fs.readFileSync(f));
}).listen(8091, "127.0.0.1");

const b = await chromium.launch({ executablePath: CHROME, headless: process.env.HEADLESS !== "0" });
const p = await b.newPage();
p.on("pageerror", (e) => console.log("SEITENFEHLER", e.message));
await p.addInitScript(() => {
  if (navigator.serial) navigator.serial.requestPort = async () => (await navigator.serial.getPorts())[0];
});
await p.goto("http://127.0.0.1:8091/de/flash.html", { waitUntil: "networkidle" });
await p.waitForFunction(() => document.getElementById("flash-version").textContent !== "", null, { timeout: 30000 });
const vorher = await p.evaluate(async () => ({ serial: "serial" in navigator, ports: navigator.serial ? (await navigator.serial.getPorts()).map((x) => x.getInfo()) : [] }));
console.log("vorher", JSON.stringify(vorher));
if (!vorher.ports.length) { console.log("KEIN PORT freigegeben"); process.exit(2); }
const beginn = Date.now();
await p.click("#flash-start");
let letzter = "";
for (;;) {
  await p.waitForTimeout(3000);
  const z = await p.evaluate(() => ({
    status: document.getElementById("flash-status").textContent,
    fehler: document.getElementById("flash-status").classList.contains("fehler"),
    balken: document.getElementById("flash-balken").style.width,
    laeuft: document.getElementById("flash-start").disabled,
  }));
  const zeile = `${z.balken} ${z.status}`;
  if (zeile !== letzter) { console.log(`${Math.round((Date.now() - beginn) / 1000)} s  ${zeile}`); letzter = zeile; }
  if (!z.laeuft || z.fehler || Date.now() - beginn > 900000) break;
}
console.log("--- Protokoll (Auszug)");
console.log((await p.textContent("#flash-log")).split("\n").filter((l) => !l.startsWith("Writing at") && l.trim()).slice(-25).join("\n"));
await b.close();
server.close();
