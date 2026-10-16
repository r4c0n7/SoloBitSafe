import pathlib
import sys

import segno
from PIL import Image

WURZEL = pathlib.Path(__file__).resolve().parents[1]
REPO = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else WURZEL.parent / "BitGo-LuckyWallet"
VORSCHAU = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
ZIEL = WURZEL / "docs" / "img"
SPENDE = "bc1q8draqujtwuy9gx799n0e5vylvx4aftrvd90trr"


def webp(quelle, ziel, breite=None):
    ziel.parent.mkdir(parents=True, exist_ok=True)
    b = Image.open(quelle).convert("RGB")
    if breite and b.width > breite:
        b = b.resize((breite, round(b.height * breite / b.width)), Image.LANCZOS)
    b.save(ziel, "WEBP", quality=82, method=6)


def main():
    DISPLAY = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else None
    if DISPLAY:
        for sprache in ["en", "de", "es", "fr"]:
            for f in sorted((DISPLAY / sprache).glob("*.png")):
                webp(f, ZIEL / "display" / sprache / (f.stem + ".webp"))
    webp(REPO / "docs/brand/solobitsafe-mark-512.png", ZIEL / "mark.webp", 256)
    (ZIEL / "mark.svg").write_bytes((REPO / "docs/brand/solobitsafe-mark.svg").read_bytes())
    if VORSCHAU:
        for sprache in ["en", "de", "es", "fr"]:
            for f in sorted((VORSCHAU / sprache).glob("*.png")):
                breite = 1600 if "desktop" in f.name else 720
                webp(f, ZIEL / sprache / (f.stem + ".webp"), breite)
    segno.make(f"bitcoin:{SPENDE.upper()}", error="m").save(
        ZIEL / "spende-qr.svg", scale=6, border=2, dark="#1c232d", light="#ffffff"
    )
    print("Bilder:", sum(1 for _ in ZIEL.rglob("*.*")))


main()
