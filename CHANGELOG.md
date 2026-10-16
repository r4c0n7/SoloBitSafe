# Changelog

What changed, day by day, since the project started on 8 October 2026.

Website: https://r4c0n7.github.io/SoloBitSafe/changelog.html

## 2026-10-16

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
