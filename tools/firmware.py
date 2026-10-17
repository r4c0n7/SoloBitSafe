import hashlib
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

WURZEL = pathlib.Path(__file__).resolve().parent.parent
ZIEL = WURZEL / "docs" / "firmware"

DATEIEN = {
    "app": ("app.bin", 0x10000),
    "otadata": ("otadata-leer.bin", 0xE000),
    "bootloader": ("bootloader.bin", 0x0),
    "partitions": ("partitions.bin", 0x8000),
    "boot_app0": ("boot_app0.bin", 0xE000),
}
ABLAEUFE = {
    "update": ["app", "otadata"],
    "komplett": ["bootloader", "partitions", "boot_app0", "app"],
}


def main():
    quelle = sys.argv[1] if len(sys.argv) > 1 else "flasher-images"
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(["scp", "-q", "-o", "HostName=192.168.1.206", "-r", "pi:" + quelle, t], check=True)
        q = pathlib.Path(t, pathlib.Path(quelle).name)
        version = (q / "VERSION").read_text().strip()
        if ZIEL.exists():
            shutil.rmtree(ZIEL)
        ordner = ZIEL / version
        ordner.mkdir(parents=True)
        dateien = {}
        for name, (datei, adresse) in DATEIEN.items():
            daten = (q / datei).read_bytes()
            (ordner / datei).write_bytes(daten)
            dateien[name] = {
                "pfad": f"{version}/{datei}",
                "adresse": adresse,
                "groesse": len(daten),
                "sha256": hashlib.sha256(daten).hexdigest(),
            }
    manifest = {"version": version, "chip": "ESP32-S3", "flash": "16MB", "dateien": dateien, "ablaeufe": ABLAEUFE}
    (ZIEL / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    for name, d in dateien.items():
        print(f"   {name:<11} 0x{d['adresse']:06x} {d['groesse']:>8} {d['sha256'][:16]}")
    print(f"Version {version} -> {ZIEL}")


if __name__ == "__main__":
    main()
