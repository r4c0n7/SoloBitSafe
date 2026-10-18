# Changelog

What changed, day by day, since the project started on 8 October 2026.

Website: https://r4c0n7.github.io/SoloBitSafe/changelog.html

## 2026-10-18 – V1.0.28b

- Version V1.0.28b (firmware) and app 1.0.14-b
- Electrum over USB confirmed: Electrum 4.8 finds the device as a hardware wallet (Jade protocol), shows addresses on the display and signs with BTN1 – Sparrow and HWI use the same protocol, signing there is still being tested
- When Electrum or Sparrow connect while the wallet is locked, the device now waits up to two minutes and shows the address to unlock in the browser as text and QR code; Electrum continues by itself once unlocked
- The device no longer writes its log over USB unless a reader asks for it, so Electrum and Sparrow never receive stray log text
- Firmware updates from the app: right after BTN1 the display shows the approval, then the progress in percent, the signature check and the restart; after the restart it confirms the old and new version. One click in the app is enough

## 2026-10-18 – V1.0.21b

- Version V1.0.21b (firmware) and app 1.0.13-b
- Bluetooth: a second and third pairing window in a row now works without a restart – the Bluetooth start reserves its memory in a fixed order
- Changing the passphrase no longer restarts the device: the key derivation runs in its own task with enough stack and uses PSRAM
- Bluetooth turns off at once after a cancelled or rejected pairing and whenever the wallet is locked; a new pairing needs BTN1 again
- Windows app: pairing again after an earlier session waits until Windows has removed the old key, and a rejected pairing explains the next step
- After connecting, the app checks that the device's replies arrive and subscribes again if they do not – no more "The device does not respond" after unlocking
- Firmware updates over the air verified on a board with Secure Boot and flash encryption

## 2026-10-17 – V1.0.13b

- Version V1.0.13b
- The device's miner dashboard no longer loads fonts from Google – opening it sends nothing to third parties
- Web flasher: hardened install (Secure Boot + flash encryption) is now available and preselected as the recommended choice, with its own confirmation; it only starts after the chip key is verified and checks the first hardened boot
- Privacy page, setup guide with the chip key prompt, security policy for reporting vulnerabilities

## 2026-10-17 – V1.0.12b

- Version V1.0.12b
- More internal RAM for Bluetooth: mining data and the dashboard status now live in PSRAM – about 4 KB more free memory at idle
- New privacy page in four languages: no accounts, no analytics, no tracking, and every place where data leaves your hands
- The website now serves its fonts itself instead of loading them from Google Fonts

## 2026-10-17 – V1.0.11b

- Version V1.0.11b
- Chip-bound security key (eFuse pepper) for every board: on the first start the device asks to burn it with BTN1, and the web flasher guides you through it. It protects the seed if the flash is ever read out and is required for mainnet wallets
- The key can also be burned later from the app or over USB, Bluetooth and Wi-Fi; boards that can no longer take a key are reported clearly
- Hardened install now runs in two stages: standard install, security key, then Secure Boot and flash encryption
- Website: "Bit" in SoloBitSafe in Bitcoin orange, colour accents for sections, columns, technical details and the latest changes, clearer texts

## 2026-10-17 – V1.0.10b

- Version V1.0.10b
- The currency chosen in the app (Android, Windows, Linux) now also applies on the device display and in the web dashboard, like the language
- Mining dashboard in the apps: hashrate with the last hour, shares, best diff, pool, network, chance per day and device temperature – over USB, Bluetooth or Wi-Fi
- Web flasher: the device now restarts by itself after flashing; new "Erase" option (factory reset of wallet, Wi-Fi and settings, also with Secure Boot)
- Web flasher: full install offers standard or hardened (Secure Boot + flash encryption, recommended); hardened opens after a test on a fresh board
- Support section: donations decide which boards get supported next

## 2026-10-17

- Web flasher: plug in the T-Display-S3 and install SoloBitSafe in Chrome or Edge – Update keeps wallet, settings and Wi-Fi, Full install sets up a new board
- Updates also work on devices with Secure Boot and flash encryption: the browser detects them and writes encrypted in sections
- Every image is checked with SHA-256 before writing; the setup guide now points to the flasher
- The flasher's write path was tested on the reference device with Secure Boot: encrypted update in 102 s, wallet kept, device starts the new image
- On Linux, Chrome can lose the connection when the chip enters download mode; the page says so – use Windows or macOS for now

## 2026-10-17 – V1.0.9b

- Version V1.0.9b
- Secure Boot v2 and flash encryption enabled on the reference device: only signed firmware starts, the flash cannot be read out, wallet and settings kept
- Recovery over USB proven: signed, encrypted images are written in watchdog-safe chunks
- The status page reports which firmware slot is running
- Fixed: a read past a buffer when looking for a custom Wi-Fi name
- Key model planned for other devices: updates are signed only by the publisher, standard firmware without Secure Boot or hardened mode as an opt-in; users only manage their seed words

## 2026-10-16 – V1.0.8b

- Version V1.0.8b
- Web dashboard and wallet page: labels with higher contrast and slightly larger small text

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
