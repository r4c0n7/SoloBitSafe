# SoloBitSafe – website

**https://r4c0n7.github.io/SoloBitSafe/** · English, [Deutsch](https://r4c0n7.github.io/SoloBitSafe/de/), [Español](https://r4c0n7.github.io/SoloBitSafe/es/), [Français](https://r4c0n7.github.io/SoloBitSafe/fr/)

Project page of SoloBitSafe, a Bitcoin keystore and solo miner on the LilyGo T-Display-S3,
with its Android, Windows and Linux app. [Changelog](CHANGELOG.md).

## Build

```bash
node tools/bilder_aufnehmen.js                              # pictures -> roh/vorschau, roh/display (PNG)
py tools/bilder.py <firmware-repo> roh/vorschau roh/display  # -> docs/img (WebP), donation QR
py tools/build.py                                           # texts (tools/texte.py) -> docs/*.html, CHANGELOG.md
```

GitHub Pages serves `docs/` from `main`. The pictures are taken from two exports of the firmware
repo, both rendered with the public BIP39 test wallet; generate them before `bilder_aufnehmen.js`:

```bash
cd app && DESIGN_EXPORT=~/Desktop/SoloBitSafe-Design-Export flutter test test/design_export_test.dart
node tools/design/dashboard_export.js ~/Desktop/SoloBitSafe-Dashboard-Export
```

The web flasher images come from `tools/pi/flasher-images.sh` on the Pi; `py tools/firmware.py <dir>` (default `flasher-images`)
copies them to `docs/firmware/<version>/` and writes `manifest.json`, `node tools/flash_pruefen.js`
checks the flasher page.

## Support

Donation address (Bitcoin): `bc1q8draqujtwuy9gx799n0e5vylvx4aftrvd90trr`
