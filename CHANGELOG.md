# Changelog

What changed, day by day, since the project started on 8 October 2026.

Website: https://r4c0n7.github.io/SoloBitSafe/changelog.html

## 2026-10-16 – V1.0.7b

- Version V1.0.7b
- New: change the passphrase from the app – current passphrase plus BTN1 on the device; seed, balance and address book stay the same
- Website: interactive 3D model of the board showing where BTN1 and BTN2 are

## 2026-10-16 – V1.0.6b

- Version V1.0.6b
- Security review: parsers for PSBT, Jade, commands and frames fuzzed with AddressSanitizer and UBSan – no findings
- Hardening: stronger stack protection, pinned library versions, passwords masked in the device log
- Display easier to read: larger small text, better contrast, every text checked to fit in all four languages
- App: higher contrast, larger text, aligned buttons and a clear fee list
- Website: setup guide, and screenshots in the language of the page

## 2026-10-16 – V1.0.5b

- Version V1.0.5b
- Fixed: the display froze while Bluetooth was on, so a language change from the app did not show up
- Fixed: after unlocking over Bluetooth the display showed "in the app" instead of the balance and no last transaction

## 2026-10-16 – V1.0.4b

- Version V1.0.4b
- Bluetooth pairings are forgotten when a wallet is created, restored or deleted
- More detailed memory diagnostics while Bluetooth is on, as groundwork for the stable release

## 2026-10-16 – V1.0.3b

- Version V1.0.3b
- One language everywhere: device display, web dashboard and app follow the language set on the device, default English
- The device display is now available in English, German, Spanish and French
- Changing the language in the app, the dashboard or the wallet page applies everywhere at once
- Fixed: the check mark on the display was missing from the built-in font

## 2026-10-16 – V1.0.2b

- Version V1.0.2b
- Updates carry a signed version number; older firmware is rejected
- The app falls back to other Electrum and Esplora servers when one is down, and remembers the one that works
- Bluetooth: the second pairing window after a pairing works again, the device keeps the confirmed pairing
- Status raised from experimental to beta
- Secure Boot v2 and flash encryption prepared: bootloader build, signed images, recovery path over USB, dry run
- Bluetooth passkey entered in the app on Android too; app lock with fingerprint or Windows Hello
- Lock chip with remaining time in the app; locking returns to the passphrase screen
- Balance from the device shown immediately, descriptor cache, partial sync, Electrum as default server
- Contacts appear as suggestions in the recipient field
- Release builds now start manually

## 2026-10-15 – V1.0.1b

- Version V1.0.1b across firmware, app and documentation
- Windows: MSI installer and portable ZIP; Bluetooth pairing through the Windows API
- Receiving on the main address with the vault logo in the QR code
- Bluetooth no longer restarts after pairing while the wallet is unlocked

## 2026-10-14

- Find the device on the local network by name or last known address
- Pairing confirmed on the display, parallel sync, live lockout time
- Bluetooth works again next to Wi-Fi, TLS and the miner
- Watchdog against freezes; crash when unlocking over Bluetooth fixed

## 2026-10-13

- New name SoloBitSafe with the vault-and-coin logo on device, web and app
- Hardening: delete the wallet only on the device, CSRF protection, throttling per address, minimum passphrase length
- Updates accepted only with an Ed25519 signature
- Miner: stricter checks on pool data, faster software core

## 2026-10-12

- First version of the app for Android, Windows and Linux
- Send, fee bump, cancel and CPFP; find and merge funds on other addresses
- Pair the app only after comparing the fingerprint and pressing BTN1
- Several wallets in the app

## 2026-10-11

- USB channel for the app with signing only after BTN1
- Jade-compatible: Electrum, Sparrow and HWI detect the device
- Enter seed words on the device; restore from app or browser only after BTN1
- Bluetooth commands and descriptors for all four address types

## 2026-10-10

- Receive and send with Taproot, nested SegWit and legacy addresses
- Schnorr signatures (BIP340) and Taproot key tweak
- Mining: midstate bug fixed, +16 % hashrate, independent share checks, pool failover

## 2026-10-09

- eFuse pepper burned; first mainnet transactions sent and confirmed
- Web dashboard with history, euro and dollar amounts, Signet
- Display redesigned; QR code visible while locked
- Over-the-air updates with rollback

## 2026-10-08

- Project start on top of NerdMiner V2
- Seed vault with Argon2id and AES-256-GCM, encrypted address book
- BIP84 derivation, deterministic ECDSA, SegWit transactions cross-checked by Electrum
- 16 MB partition layout, HTTPS API, dashboard and PSBT signing
