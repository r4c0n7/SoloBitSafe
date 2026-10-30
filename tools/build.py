import html
import re
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from texte import DATUM, LOG, SPENDE, SPRACHEN, T, VERSION
from anleitung import ANLEITUNG
from flasher_texte import FLASHER
from datenschutz import DATENSCHUTZ
import json

WURZEL = pathlib.Path(__file__).resolve().parents[1]
DOCS = WURZEL / "docs"
URL = "https://r4c0n7.github.io/SoloBitSafe/"
REPO = "https://github.com/r4c0n7/SoloBitSafe"
ANKER = ["ablauf", "ansichten", "technik", "aenderungen", "unterstuetzen"]
e = html.escape


def akzent(text):
    return re.sub(r"\*([^*]+)\*", lambda m: f'<em class="akzent">{m.group(1)}</em>', e(text))


TEIL = re.compile(r"(<script\b.*?</script>|<[^>]+>)", re.S)


def marke(seite):
    kopf, trenn, rumpf = seite.partition("<body>")
    if not trenn:
        return seite
    teile = TEIL.split(rumpf)
    for i in range(0, len(teile), 2):
        teile[i] = teile[i].replace("SoloBitSafe", 'Solo<span class="bit">Bit</span>Safe')
    return kopf + trenn + "".join(teile)


def pfad(sprache, seite=""):
    return ("" if sprache == "en" else f"{sprache}/") + seite


def relativ(von, sprache, seite=""):
    hoch = "" if von == "en" else "../"
    return hoch + pfad(sprache, seite) or "./"


def kopf(s, t, seite, titel, beschreibung):
    hoch = "" if s == "en" else "../"
    alternativen = "\n".join(
        f'<link rel="alternate" hreflang="{x}" href="{URL}{pfad(x, seite)}">' for x in SPRACHEN
    )
    return f"""<!doctype html>
<html lang="{s}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titel)}</title>
<meta name="description" content="{e(beschreibung)}">
<link rel="canonical" href="{URL}{pfad(s, seite)}">
{alternativen}
<link rel="alternate" hreflang="x-default" href="{URL}{seite}">
<meta property="og:title" content="{e(titel)}">
<meta property="og:description" content="{e(beschreibung)}">
<meta property="og:image" content="{URL}img/display/{s}/3b-wallet-entsperrt.webp">
<meta property="og:url" content="{URL}{pfad(s, seite)}">
<meta name="theme-color" content="#1c232d">
<link rel="icon" href="{hoch}img/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="{hoch}fonts/fonts.css">
<link rel="stylesheet" href="{hoch}style.css">
{'<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>' + chr(10) + f'<script type="module" src="{hoch}geraet3d.js"></script>' if seite == "" else ""}
{'<script type="importmap">{"imports":{"esptool-js":"https://cdn.jsdelivr.net/npm/esptool-js@0.7.0/lib/index.js","pako":"https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.esm.mjs","atob-lite":"https://cdn.jsdelivr.net/npm/atob-lite@2.0.0/+esm"}}</script>' + chr(10) + f'<script type="module" src="{hoch}flasher.js"></script>' if seite == "flash.html" else ""}
</head>
<body>
<a class="sprung" href="#inhalt">{e(t["nav"][0])}</a>
"""


def leiste(s, t, seite):
    start = relativ(s, s)
    nav = "".join(
        f'<a href="{start if seite else ""}#{a}">{e(n)}</a>' for a, n in zip(ANKER, t["nav"])
    ) + f'<a href="guide.html"{' aria-current="page"' if seite == "guide.html" else ""}>{e(ANLEITUNG[s]["titel"])}</a>' + f'<a href="flash.html"{' aria-current="page"' if seite == "flash.html" else ""}>{e(FLASHER[s]["nav"])}</a>'
    sprachen = "".join(
        f'<a href="{relativ(s, x, seite)}" hreflang="{x}" lang="{x}"'
        + (' aria-current="true"' if x == s else "")
        + f">{x.upper()}</a>"
        for x in SPRACHEN
    )
    hoch = "" if s == "en" else "../"
    return f"""<header class="leiste">
<a class="marke" href="{start}"><img src="{hoch}img/mark.svg" alt="" width="32" height="32"><span>SoloBitSafe</span></a>
<nav class="nav" aria-label="SoloBitSafe">{nav}</nav>
<nav class="sprachen" aria-label="{e(t["sprache"])}">{sprachen}</nav>
</header>
"""


def fuss(s, t):
    hoch = "" if s == "en" else "../"
    return f"""<footer class="fuss">
<p>{e(t["fuss_quellen"])} <a href="{REPO}">{e(t["fuss_seite"])}</a></p>
<p class="klein">{e(t["fuss_lizenz"])}</p>
<p class="klein"><a href="privacy.html">{e(DATENSCHUTZ[s]["nav"])}</a></p>
</footer>
<script src="{hoch}seite.js" defer></script>
</body>
</html>
"""


def geraet(s, t):
    hoch = "" if s == "en" else "../"
    bilder = "".join(
        f'<img src="{hoch}img/display/{s}/{n}.webp" alt="" width="960" height="510"'
        + (' class="beleg"' if n.startswith("4a") else "")
        + ">"
        for n in ["0-start", "1-mining", "3b-wallet-entsperrt", "4a-beleg-kontakt"]
    )
    daten = ",".join(f"{hoch}img/display/{s}/{n}.webp" for n in ["0-start", "1-mining", "3b-wallet-entsperrt", "4a-beleg-kontakt"])
    return f"""<figure class="geraet" role="img" aria-label="{e(t["geraet_alt"])}">
<div class="geraet-3d" data-bilder="{daten}" data-btn1="BTN1 · BOOT" data-btn2="BTN2 · IO14"></div>
<div class="platine">
<span class="usb"></span>
<span class="taste t1"><span class="taste-name">{t["btn1"]}</span></span>
<span class="taste t2"></span>
<div class="schirm">{bilder}</div>
</div>
</figure>"""


def galerie(s, t):
    hoch = "" if s == "en" else "../"
    app = ["uebersicht", "empfangen", "senden", "verlauf", "geraet"]
    gruppen = [
        [(f"{hoch}img/{s}/app-handy-{n}.webp", t["bild"][n], "hoch") for n in app],
        [(f"{hoch}img/{s}/app-desktop-{n}.webp", t["bild"][n], "breit") for n in app],
        [(f"{hoch}img/{s}/web-desktop-{n[4:]}.webp", t["bild"][n], "breit")
         for n in ["web-gesperrt", "web-offen-1", "web-offen-2", "web-offen-3"]],
        [(f"{hoch}img/display/{s}/{n}.webp", t["bild"][n], "display")
         for n in ["0-start", "1-mining", "2-netzwerk", "3a-wallet-gesperrt", "3b-wallet-entsperrt", "4a-beleg-kontakt"]],
    ]
    knoepfe = "".join(
        f'<button type="button" role="tab" id="r{i}" aria-controls="g{i}" aria-selected="{"true" if i == 0 else "false"}"'
        + ("" if i == 0 else ' tabindex="-1"')
        + f">{e(n)}</button>"
        for i, n in enumerate(t["reiter"])
    )
    felder = ""
    for i, g in enumerate(gruppen):
        figuren = "".join(
            f'<figure class="{art}"><a href="{src}"><img src="{src}" alt="{e(text)}" loading="lazy"></a><figcaption>{e(text)}</figcaption></figure>'
            for src, text, art in g
        )
        felder += f'<div class="band" role="tabpanel" id="g{i}" aria-labelledby="r{i}"{"" if i == 0 else " hidden"}>{figuren}</div>'
    return f'<div class="reiter" role="tablist">{knoepfe}</div>{felder}'


def log_eintraege(s, t, anzahl=None):
    aus = ""
    for i, (tag, version, punkte) in enumerate(LOG[:anzahl] if anzahl else LOG):
        j, m, d = tag.split("-")
        kennung = f'<span class="version">{version}</span>' if version else ""
        if i == 0:
            kennung += f'<span class="neu">{e(t["neueste"])}</span>'
        liste = "".join(f"<li>{e(p)}</li>" for p in punkte[s])
        aus += f'<article class="tag" id="t{tag}{'-' + version if version else ''}"><h3><time datetime="{tag}">{DATUM[s](int(d), int(m))}</time>{kennung}</h3><ul>{liste}</ul></article>'
    return aus


def spende(s, t):
    hoch = "" if s == "en" else "../"
    gruppen = " ".join(SPENDE[i:i + 4] for i in range(0, len(SPENDE), 4))
    return f"""<div class="spende">
<img class="qr" src="{hoch}img/spende-qr.svg" alt="{e(t["qr_alt"])}" width="240" height="240">
<div>
<p class="spende-label">{e(t["spende_label"])}</p>
<p class="adresse" data-adresse="{SPENDE}"><code>{gruppen}</code></p>
<p class="aktionen">
<button type="button" class="knopf primaer" data-kopieren data-fertig="{e(t["kopiert"])}">{e(t["kopieren"])}</button>
<a class="knopf" href="bitcoin:{SPENDE}">{e(t["wallet_oeffnen"])}</a>
</p>
</div>
</div>"""


def startseite(s):
    t = T[s]
    schritte = "".join(
        f"<li><h3>{e(a)}</h3><p>{e(b)}</p></li>" for a, b in t["ablauf"]
    )
    spalten = "".join(
        f'<section class="spalte"><h3>{e(t[k + "_h"])}</h3><ul>{"".join(f"<li>{e(x)}</li>" for x in t[k])}</ul></section>'
        for k in ["wallet", "miner", "app"]
    )
    technik = "".join(f"<dt>{e(a)}</dt><dd>{e(b)}</dd>" for a, b in t["technik"])
    return (
        kopf(s, t, "", t["titel"], t["beschreibung"])
        + leiste(s, t, "")
        + f"""<main id="inhalt">
<section class="held">
<div class="held-text">
<h1>{akzent(t["h1"])}</h1>
<p class="lead">{e(t["lead"])}</p>
<p class="aktionen"><a class="knopf primaer" href="guide.html">{e(ANLEITUNG[s]["titel"])}</a><a class="knopf" href="flash.html">{e(FLASHER[s]["titel"])}</a><a class="knopf" href="#ansichten">{e(t["knopf_screens"])}</a><a class="knopf" href="changelog.html">{e(t["knopf_log"])}</a></p>
<p class="stand">{e(t["stand"].format(v=VERSION, d=DATUM[s](int(LOG[0][0][8:10]), int(LOG[0][0][5:7]))))}</p>
</div>
{geraet(s, t)}
</section>
<p class="warnung" role="note">{e(t["warnung"])}</p>
<section class="block" id="ablauf"><h2>{e(t["ablauf_h"])}</h2><ol class="schritte">{schritte}</ol></section>
<section class="block hell"><div class="innen"><h2>{e(t["kann_h"])}</h2><div class="spalten">{spalten}</div></div></section>
<section class="block" id="ansichten"><h2>{e(t["bilder_h"])}</h2><p class="text">{e(t["bilder_text"])}</p>{galerie(s, t)}</section>
<section class="block hell" id="technik"><div class="innen"><h2>{e(t["technik_h"])}</h2><dl class="technik">{technik}</dl></div></section>
<section class="block" id="aenderungen"><h2>{e(t["log_h"])}</h2><p class="text">{e(t["log_text"])}</p><div class="log">{log_eintraege(s, t, 2)}</div><p><a class="knopf" href="changelog.html">{e(t["log_link"])}</a></p></section>
<section class="block" id="unterstuetzen"><h2>{e(t["spende_h"])}</h2><p class="text">{e(t["spende_text"])}</p>{spende(s, t)}</section>
</main>
"""
        + fuss(s, t)
    )


def changelog(s):
    t = T[s]
    return (
        kopf(s, t, "changelog.html", f'{t["log_h"]} – SoloBitSafe', t["log_text"])
        + leiste(s, t, "changelog.html")
        + f"""<main id="inhalt" class="schmal">
<p><a href="./">{e(t["log_zurueck"])}</a></p>
<h1>{e(t["log_h"])}</h1>
<p class="text">{e(t["log_text"])}</p>
<div class="log">{log_eintraege(s, t)}</div>
<section class="block" id="unterstuetzen"><h2>{e(t["spende_h"])}</h2>{spende(s, t)}</section>
</main>
"""
        + fuss(s, t)
    )


def anleitung(s):
    t = T[s]
    a = ANLEITUNG[s]
    schritte = "".join(
        f'<li><h2>{e(titel)}</h2><ul>{"".join(f"<li>{e(p)}</li>" for p in punkte)}</ul></li>'
        for titel, punkte in a["schritte"]
    )
    tasten = "".join(f"<dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in a["tasten"])
    return (
        kopf(s, t, "guide.html", f'{a["titel"]} – SoloBitSafe', a["intro"])
        + leiste(s, t, "guide.html")
        + f"""<main id="inhalt" class="schmal">
<p><a href="./">{e(t["log_zurueck"])}</a></p>
<h1>{e(a["titel"])}</h1>
<p class="text">{e(a["intro"])}</p>
<section class="tasten"><h2>{e(a["tasten_h"])}</h2><dl class="technik">{tasten}</dl></section>
<ol class="anleitung">{schritte}</ol>
</main>
"""
        + fuss(s, t)
    )


def flash(s):
    t = T[s]
    f = FLASHER[s]
    schritte = "".join(f"<li>{e(x)}</li>" for x in f["schritte"])
    arten = "".join(
        f'<label class="wahl"><input type="radio" name="art" value="{k}"{" checked" if k == "update" else ""}>'
        f'<span><strong>{e(f[k][0])}</strong><span>{e(f[k][1])}</span></span></label>'
        for k in ["update", "komplett", "loeschen"]
    )
    varianten = "".join(
        f'<label class="wahl"><input type="radio" name="variante" value="{k}"{" checked" if k == "gehaertet" else ""}>'
        f'<span><strong>{e(f[k][0])}</strong><span>{e(f[k][1])}</span></span></label>'
        for k in ["gehaertet", "standard"]
    )
    daten = json.dumps({"m": f["m"], "version": f["version"], "bald": f["gehaertet_bald"]}, ensure_ascii=False).replace("</", "<\\/")
    return (
        kopf(s, t, "flash.html", f'{f["titel"]} – SoloBitSafe', f["intro"])
        + leiste(s, t, "flash.html")
        + f"""<main id="inhalt" class="schmal">
<p><a href="./">{e(t["log_zurueck"])}</a></p>
<h1>{e(f["titel"])}</h1>
<p class="text">{e(f["intro"])}</p>
<ol class="flash-schritte">{schritte}</ol>
<section class="flasher" data-firmware="{"" if s == "en" else "../"}firmware/">
<p class="flash-version" id="flash-version"></p>
<fieldset><legend>{e(f["art_h"])}</legend>{arten}</fieldset>
<fieldset class="variante" hidden><legend>{e(f["variante_h"])}</legend>{varianten}<p class="text klein" id="flash-bald" hidden></p></fieldset>
<label class="bestaetigen" hidden><input type="checkbox" id="flash-ok"> {e(f["bestaetigen"])}</label>
<label class="bestaetigen bestaetigen-haerten" hidden><input type="checkbox" id="flash-haerten-ok"> {e(f["bestaetigen_haerten"])}</label>
<p class="aktionen"><button type="button" class="knopf primaer" id="flash-start" disabled>{e(f["start"])}</button></p>
<div class="flash-balken" hidden><div id="flash-balken"></div></div>
<p class="flash-status" id="flash-status" role="status" aria-live="polite"></p>
<details><summary>{e(f["log_h"])}</summary><pre id="flash-log"></pre></details>
<p class="text klein">{e(f["hinweis"])}</p>
</section>
<script type="application/json" id="flash-texte">{daten}</script>
</main>
"""
        + fuss(s, t)
    )


def datenschutz(s):
    t = T[s]
    d = DATENSCHUTZ[s]
    teile = "".join(
        f'<section class="block-klein"><h2>{e(h)}</h2>{"".join(f"<p>{e(p)}</p>" for p in absaetze)}</section>'
        for h, absaetze in d["abschnitte"]
    )
    return (
        kopf(s, t, "privacy.html", f'{d["titel"]} – SoloBitSafe', d["intro"])
        + leiste(s, t, "privacy.html")
        + f"""<main id="inhalt" class="schmal datenschutz">
<p><a href="./">{e(t["log_zurueck"])}</a></p>
<h1>{e(d["titel"])}</h1>
<p class="lead">{e(d["intro"])}</p>
{teile}
<p class="stand">{e(d["stand"])}</p>
</main>
"""
        + fuss(s, t)
    )


def markdown():
    t = T["en"]
    zeilen = ["# Changelog", "", t["log_text"], "", f"Website: {URL}changelog.html", ""]
    for tag, version, punkte in LOG:
        zeilen.append(f"## {tag}" + (f" – {version}" if version else ""))
        zeilen.append("")
        zeilen += [f"- {p}" for p in punkte["en"]]
        zeilen.append("")
    return "\n".join(zeilen)


def main():
    for s in SPRACHEN:
        ordner = DOCS if s == "en" else DOCS / s
        ordner.mkdir(parents=True, exist_ok=True)
        (ordner / "index.html").write_text(marke(startseite(s)), encoding="utf-8")
        (ordner / "changelog.html").write_text(marke(changelog(s)), encoding="utf-8")
        (ordner / "guide.html").write_text(marke(anleitung(s)), encoding="utf-8")
        (ordner / "flash.html").write_text(marke(flash(s)), encoding="utf-8")
        (ordner / "privacy.html").write_text(marke(datenschutz(s)), encoding="utf-8")
    (WURZEL / "CHANGELOG.md").write_text(markdown(), encoding="utf-8")
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    print("gebaut:", ", ".join(SPRACHEN))


main()
