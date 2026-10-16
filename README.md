# SoloBitSafe – website

**https://r4c0n7.github.io/SoloBitSafe/** · English, [Deutsch](https://r4c0n7.github.io/SoloBitSafe/de/), [Español](https://r4c0n7.github.io/SoloBitSafe/es/), [Français](https://r4c0n7.github.io/SoloBitSafe/fr/)

Project page of SoloBitSafe, a Bitcoin keystore and solo miner on the LilyGo T-Display-S3,
with its Android, Windows and Linux app. [Changelog](CHANGELOG.md).

## Build

```bash
py tools/bilder.py <firmware-repo> <preview-folder>   # screenshots -> docs/img (WebP), donation QR
py tools/build.py                                     # texts (tools/texte.py) -> docs/*.html, CHANGELOG.md
```

GitHub Pages serves `docs/` from `main`. Screenshots come from the app (`app/test/vorschau_test.dart`
with `VORSCHAU=<folder>`) and the web dashboard (`tools/ui-pruefung/vorschau.js` against the mock device),
both rendered with the public BIP39 test wallet.

## Support

Donation address (Bitcoin): `bc1q8draqujtwuy9gx799n0e5vylvx4aftrvd90trr`
