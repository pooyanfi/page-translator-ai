<img src="../../icons/icon-128.png" width="88" align="right" alt="Symbol von AI Page Translator">

# AI Page Translator — das Web mit Ihrer eigenen KI übersetzen

**Übersetzen Sie jede Webseite in Ihre Sprache – mit dem KI-Anbieter Ihrer Wahl: ohne Backend, ohne Konto, ohne Tracking und ohne Abrechnung pro Wort.**

`Manifest V3` · `Kein Build-Schritt` · `Reines JavaScript` · `Version 1.3.1` · `22 Sprachen`

Diese Datei ist die deutsche Übersetzung des [kanonischen englischen README](README.md). Bei Abweichungen gilt der englische Text.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · **Deutsch** · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator ist eine Browsererweiterung für **Brave** und andere Chromium-Browser. Den Anbieter bringen Sie mit: einen kostenlosen Google-Gemini-Schlüssel, einen beliebigen OpenAI-kompatiblen Endpunkt (OpenRouter, Groq, NVIDIA, OpenAI…) oder ein vollständig lokales Modell über **Ollama**. Die Erweiterung übersetzt die Seite, die Sie lesen, an Ort und Stelle und behält Layout, Links und Formatierung bei.

Kein Text läuft über einen Übersetzungsdienst. Ihr API-Schlüssel verlässt den Browser nie, es gibt keine Analytik, und mit Ollama verlässt der Text nicht einmal Ihren Rechner.

> **Stand:** Version 1.3.1 · 95 automatisierte Tests · eine Prüfung in 12 Punkten · keine Telemetrie, kein entfernter Code.

---

## Warum ein weiterer Übersetzer?

Die meisten Seitenübersetzer senden jeweils einen Satz. Deshalb liest sich das Ergebnis wie ein Stapel Sätze statt wie eine Seite: Der Kontext geht verloren, die Terminologie driftet, Links zerschneiden Sätze, und die Zielsprache erbt die Wortstellung der Ausgangssprache.

Diese Erweiterung übersetzt **Blöcke** statt Textknoten:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Der Block geht als eine Einheit hinaus, das Inline-Markup wird durch nummerierte Token ersetzt:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` markiert Inline-Inhalt, der zum Satz gehört (ein Link, eine Hervorhebung, ein Span); `<vN/>` markiert Inline-Inhalt, der nie übersetzt werden darf (Code, Bilder, Formularelemente, Widgets). Das Modell darf Token verschieben und baut deshalb einen natürlichen Satz **um** den Link herum, statt an die englische Reihenfolge gebunden zu sein.

Auf dem Rückweg wird die Antwort geprüft, bevor die Seite angefasst wird. Jedes Token muss vorhanden, ausbalanciert und eindeutig sein; eine Übersetzung, die einen Link verliert, wird verworfen, einmal mit strengerer Anweisung wiederholt und sonst unverändert gelassen. Die ursprünglichen Elementknoten werden wiederverwendet, sodass `href`, Event-Listener und verschachteltes Markup erhalten bleiben. „Original anzeigen“ stellt genau die ursprünglichen Knoten wieder her.

## Funktionen

- **Ganzseitige Übersetzung an Ort und Stelle** — Überschriften, Absätze, Listen, Tabellen, Bildunterschriften, Schaltflächen.
- **Links und Inline-Formatierung bleiben erhalten** — token-geprüft; ein verlorener Link wird nie stillschweigend angewendet.
- **Natürlicher oder wörtlicher Stil** — *Natürlich* (Standard) formuliert wie ein muttersprachlicher Autor; *Wörtlich* bleibt bei technischen Seiten nah am Ausgangstext.
- **Stilrichtlinien je Sprache** — eigene Hinweise für Persisch, Arabisch, Urdu und Hebräisch, dazu eine allgemeine Richtlinie für die übrigen 18 Sprachen.
- **Deterministische Typografie-Korrektur** — persisches `ی`/`ک`, geschützte Leerzeichen in `می`/`ها`/`تر` und `، ؛ ؟` werden auch dann korrigiert, wenn das Modell patzt.
- **Optionaler Qualitätsdurchgang** — prüft jedes Segment als Paar {Quelle, Übersetzung} und korrigiert damit den Sinn, nicht nur die Formulierung.
- **Glossar** — feste Paare Begriff → Übersetzung, die das Modell einhalten muss.
- **Geschützte Inhalte** — `<pre>`, `<code>`, URLs, E-Mails, `translate="no"`, `contenteditable`, SVG, Formularelemente und die Oberfläche der Erweiterung werden nie gesendet.
- **Attributbeschriftungen** — `alt`, `title`, `placeholder` und `aria-label` laufen über einen eigenen Kanal und klingen wie Beschriftungen, nicht wie Absätze.
- **Dynamische Seiten** — neuer Inhalt aus Infinite Scroll oder einer SPA wird beim Erscheinen übersetzt, ohne Beobachterschleifen.
- **Richtige Rechts-nach-links-Unterstützung** — `dir` am übersetzten Block, `lang` am `<html>`, kein seitenweites Umdrehen; alles wird zurückgesetzt.
- **Erinnerung pro Website** — merkt sich die Zielsprache je Domain und kann beim Laden automatisch übersetzen.
- **Jede API** — Gemini, Ollama und jeder OpenAI-kompatible Endpunkt, aufgerufen aus dem Service Worker, also ohne CORS-Probleme.
- **Speicher-Cache, Wiederholung und Teilung** — identischer Text wird einmal gesendet; ein fehlerhafter Block wird geteilt statt die Seite scheitern zu lassen; 429/5xx werden mit wachsender Pause wiederholt.
- **Kein Build-Schritt** — einfache klassische Skripte, unverändert geladen.

## Unterstützte Sprachen

Zweiundzwanzig Zielsprachen, jede mit ihrem Eigenname im Prompt, damit das Modell `zh-TW` nicht mit `zh-CN` und Persisch nicht mit Arabisch verwechselt:

| Sprache | Eigenname | Richtung |
|---|---|---|
| Englisch | English | links nach rechts |
| Persisch | فارسی | rechts nach links |
| Arabisch | العربية | rechts nach links |
| Hebräisch | עברית | rechts nach links |
| Urdu | اردو | rechts nach links |
| Spanisch | Español | links nach rechts |
| Französisch | Français | links nach rechts |
| Deutsch | Deutsch | links nach rechts |
| Chinesisch (vereinfacht) | 中文简体 | links nach rechts |
| Chinesisch (traditionell) | 中文繁體 | links nach rechts |
| Russisch | Русский | links nach rechts |
| Türkisch | Türkçe | links nach rechts |
| Italienisch | Italiano | links nach rechts |
| Portugiesisch | Português | links nach rechts |
| Niederländisch | Nederlands | links nach rechts |
| Polnisch | Polski | links nach rechts |
| Vietnamesisch | Tiếng Việt | links nach rechts |
| Thailändisch | ไทย | links nach rechts |
| Hindi | हिन्दी | links nach rechts |
| Indonesisch | Bahasa Indonesia | links nach rechts |
| Japanisch | 日本語 | links nach rechts |
| Koreanisch | 한국어 | links nach rechts |

Rechts-nach-links-Sprachen (Persisch, Arabisch, Hebräisch, Urdu) erhalten die Richtung pro Block; der Rest der Seite behält seine Geometrie.

## Installation

1. Laden Sie dieses Repository herunter (**Code → Download ZIP** oder `git clone`) und behalten Sie den Ordner.
2. Öffnen Sie `brave://extensions` (oder `chrome://extensions`).
3. Schalten Sie den **Entwicklermodus** ein.
4. Klicken Sie auf **Load unpacked** und wählen Sie diesen Ordner (den mit `manifest.json`).
5. Heften Sie die Erweiterung an, wenn das Popup einen Klick entfernt sein soll.

Es gibt keinen Build-, Installations- oder Bündelungsschritt. Die Erweiterung liest nur die in `manifest.json` genannten Dateien; `tests/`, `scripts/`, `bench/`, `docs/` und `.github/` sind reine Entwicklung und werden nie geladen.

Erforderlich ist ein aktueller Chromium-Browser. Geschlossene Shadow Roots werden übersetzt, wo der Browser die API bereitstellt (Chromium 119+); alles andere funktioniert auch in älteren Versionen.

## Weitergabe an andere

`npm run release` baut das Paket und legt die Dateien in `release/` ab (von git ignoriert):

| Datei | Was es ist | Installation |
|---|---|---|
| `page-translator-ai-<version>.zip` | die vollständige Erweiterung, rund 95 KB, mit `INSTALL.txt` darin | entpacken → **Load unpacked**; dieselbe Datei nimmt auch ein Store an |
| `page-translator-ai-<version>.crx` | signiertes Paket | auf `brave://extensions` ziehen, wo Installationen außerhalb des Stores erlaubt sind |
| `page-translator-ai-signing-key.pem` | Signaturschlüssel | niemals weitergeben; `npm run release` verwendet ihn erneut, damit die ID der Erweiterung über Updates hinweg gleich bleibt |

Was Sie weitergeben, ist also eine einzige Datei – und sie enthält die Installationsschritte.

**Ehrliche Einschränkung:** Eine Browsererweiterung ist clientseitiger Code. Wer sie installiert, kann diese Dateien lesen – eine `.crx` ist eine signierte ZIP-Datei, eine entpackte Erweiterung ein normaler Ordner. Keine Verpackung und keine Verschleierung ändert das; Minifizierung bremst nur Leser, und Store-Richtlinien verbieten Verschleierung. Muss der Quellcode wirklich geheim bleiben, bleibt nur, Prompts und Anbieteraufrufe auf einen eigenen Server zu verlagern – womit das Modell „eigener Schlüssel, kein Backend“ aufgegeben wird.

Für Weitergabe ohne Repository veröffentlichen Sie die ZIP-Datei als **privaten oder nicht gelisteten** Eintrag im Chrome Web Store; nur so gibt es für technisch weniger versierte Nutzer eine Ein-Klick-Installation.

## Anbieter einrichten

Popup der Erweiterung → **Options & settings**, oder `brave://extensions` → Details → Erweiterungsoptionen.

| Anbieter | Endpunkt | Schlüssel | Hinweise |
|---|---|---|---|
| **Ollama** (lokal) | `http://localhost:11434` | keiner | Kostenlos und vollständig privat. Von [ollama.com](https://ollama.com) installieren, dann `ollama run llama3`. Bei 403 mit `OLLAMA_ORIGINS=chrome-extension://*` neu starten. |
| **Google Gemini** | `generativelanguage.googleapis.com` | kostenloser Schlüssel aus [AI Studio](https://aistudio.google.com/app/apikey) | Eine aktuelle Modell-ID verwenden, etwa `gemini-2.5-flash`. Gratislimits ändern sich; Googles Modellliste prüfen. |
| **OpenAI-kompatibel** | Ihr Endpunkt, z. B. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | Schlüssel des Anbieters | Jeder Dienst, der `/chat/completions` spricht. Die Vorschläge in der Oberfläche sind Beispiele – die exakte ID aus dem Katalog des Anbieters verwenden. |

Dann:

1. **Standard-Zielsprache** wählen.
2. **Übersetzungsstil** wählen: *Natural* (empfohlen) oder *Literal*.
3. Optional **Quality mode** aktivieren und **Glossareinträge** ergänzen, eine Zeile pro Eintrag (`Begriff → Übersetzung`; `->`, `=>`, `=` und TAB funktionieren ebenfalls).
4. **Ausgangssprache** auf *Auto-detect* lassen oder ausdrücklich wählen.
5. **Test connection** und danach **Save settings** anklicken.

Hinweise zu den Anbietern:

- **Geminis Denk-Einstellung wird je Modellgeneration gewählt.** 2.5 Flash/Flash-Lite laufen ohne Denken, 2.5 Pro nutzt sein Mindestbudget (128), 3.x/4.x eine niedrige Denkstufe. Lehnt ein Modell die Einstellung ab, wird die Anfrage einmal ohne sie wiederholt.
- **Ollama** wird mit einem Kontextfenster von 8192 Token aufgerufen; ein Modell mit kleinerem Training kürzt lange Seiten trotzdem – deshalb wird die Seite in kleine Einheiten geteilt.
- **Gratisangebote** begrenzen die Rate. Die Erweiterung wartet und versucht erneut; sie verwirft keinen Text stillschweigend.

## Verwendung

- Symbol anklicken → Sprache wählen → **Translate this page**.
- **Show original / Show translation** jederzeit; die Wiederherstellung ist verlustfrei.
- Mit der Maus über einen übersetzten Absatz fahren, um den Originaltext zu sehen.
- Rechtsklick → **Translate this page** oder **Translate selection**.
- Tastatur: `Ctrl+Shift+Y` (`Cmd+Shift+Y` unter macOS) schaltet die Übersetzung um; auf der Tastenkürzel-Seite des Browsers änderbar.
- Mit aktivem **Auto-translate** und gespeicherter Website-Einstellung werden passende Seiten beim Laden übersetzt.
- Einstellungen gelten für offene Tabs bei der nächsten Übersetzung; ein Neuladen ist nicht nötig.

## So funktioniert es

```
Seiten-DOM
  └─ Content-Script: Blockeinheiten sammeln, Inline-Markup als <tN>/<vN/>-Token serialisieren
       └─ Chunker: 24 Einheiten / 2400 Zeichen pro Anfrage
            └─ Service Worker: Anfrage an Ihren Anbieter (Erweiterungsursprung, kein CORS)
                 └─ Anbieter: JSON rein, JSON raus, IDs bleiben erhalten
                      └─ Prüfung: Token vollständig, ausbalanciert, eindeutig; IDs stimmen
                           └─ DOM: ursprüngliche Elementknoten wiederverwenden, nur Text setzen
                                └─ MutationObserver: neu hinzugefügten Inhalt übersetzen
```

Entscheidungen, die zählen:

- **Anbieterverkehr verlässt nie den Seitenkontext.** Das Content-Script sendet eine `AIPT_FETCH`-Nachricht; der Service Worker führt die Anfrage aus, sodass Endpunkte mit strengem CORS unverändert funktionieren. Der Service Worker prüft außerdem `sender.id`, damit nur diese Erweiterung ihn als Proxy nutzen kann.
- **Der Prompt ist ein Vertrag, kein Wunsch.** IDs rein, IDs raus; ein Eintrag pro Segment; Tags unantastbar; Zahlen, URLs, Code und Platzhalter unverändert; keine zusätzlichen Erklärungen. Antworten werden über die ID gelesen, sodass ein umsortiertes oder teilweise fehlerhaftes Array sicher scheitert, statt Übersetzungen zu verschieben.
- **Jede Sprache hat ihre Stilrichtlinie.** Die persische Richtlinie verlangt beispielsweise persische Wortstellung und Verben (`بررسی کنید`, nicht `بررسی را انجام دهید`), verbietet `می‌باشد`/`بایستی`/`گردید`, wo ein normaler Satz genügt, behält in lateinischer Schrift nur echte Lehnwörter und korrigiert Zeichensetzung und geschützte Leerzeichen. Few-Shot-Beispiele zeigen dem Modell das Ziel, statt es nur zu beschreiben.
- **Die Richtung bleibt lokal.** Persische, arabische, hebräische und Urdu-Blöcke erhalten `dir="rtl"`, `<html>` bekommt die Zielsprache, der Rest der Seite behält seine Geometrie – ein globales Umdrehen brach zentrierte Layouts und Codeblöcke. Beides wird mit dem Originaltext zurückgesetzt.
- **Fehler sind sichtbar und begrenzt.** Ein unlesbarer Block wird geteilt; eine weiterhin fehlerhafte Einheit bleibt in der Ausgangssprache und wird im Banner gemeldet. Abbrechen während der Übersetzung stoppt sauber und hinterlässt kein halb geschriebenes DOM.

Mehr Details: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Datenschutz und Berechtigungen

| Berechtigung | Warum sie nötig ist |
|---|---|
| `storage` | Einstellungen, API-Schlüssel, Glossar und Website-Einstellungen in `chrome.storage.local` speichern. |
| `contextMenus` | Rechtsklick „Diese Seite / Auswahl übersetzen“. |
| `tabs` | Nachrichten an den aktiven Tab senden und Optionen öffnen. |
| `activeTab` | Auf der Seite handeln, die Sie ausdrücklich übersetzen. |
| `<all_urls>` | Das Content-Script in besuchte Seiten einfügen und dem Service Worker den Aufruf des konfigurierten Endpunkts erlauben. |

- Der API-Schlüssel liegt nur im lokalen Speicher dieses Browsers und geht nur an den gewählten Anbieter.
- Keine Analytik, keine Telemetrie, kein entfernter Code, kein Nachhause-Telefonieren, kein Konto.
- Jeder Text wird mit `textContent` / `createTextNode` geschrieben; `innerHTML`, `eval` oder `new Function` gibt es nirgends. Modellausgabe erreicht die Seite nur als Text, und Attribute sind auf eine feste Positivliste beschränkt – `href`, `src` und Event-Handler werden nie aus Modellausgabe geschrieben.
- Website-Einstellungen schreibt ein einziger serialisierter Schreiber im Service Worker, sodass zwei Tabs einander nicht überschreiben.
- Die automatische Spracherkennung sendet höchstens 600 Zeichen an denselben Anbieter; wer die Ausgangssprache manuell wählt, spart diese Anfrage ganz.

Sicherheitsrichtlinie und Meldeweg für Schwachstellen: [`SECURITY.md`](../../SECURITY.md).

## Bekannte Einschränkungen

- **Die Token-Prüfung ist bewusst streng.** Ein Modell, das `<tN>` hartnäckig verstümmelt, lässt diese Absätze in der Ausgangssprache (und sagt es), statt einen Link zu verlieren. Ein Modell wählen, das strukturierte Ausgabe befolgt; *Test connection* prüft einen Satz mit Tags.
- **Die Qualität hängt vom Modell ab.** Kleine lokale Modelle sind brauchbar, aber weniger flüssig als Gemini oder Modelle der GPT-Klasse; die Stilschicht hilft, sie fügt kein Wissen hinzu.
- **Geschlossene Shadow Roots und Cross-Origin-Iframes** liegen außerhalb der Reichweite der Erweiterung (Browsersicherheit). Offene Shadow Roots und gleichursprüngliche Frames werden behandelt.
- **Gemischte Container mit freiem Text** (`<div>Text<p>…</p></div>`) fallen für diesen Text auf Übersetzung Knoten für Knoten zurück; wohlgeformte Seiten erreichen das nie.
- **Der Cache liegt im Arbeitsspeicher** (pro Tab-Sitzung). Ein Neuladen fordert den Text erneut an.
- **PDFs werden nicht übersetzt**; der integrierte PDF-Betrachter ist für Erweiterungen nicht skriptbar.
- **Gratisangebote ändern sich.** Ratenlimits und Modellnamen bestimmt der Anbieter, nicht diese Erweiterung.

## Projektstatus und Tests

Version 1.3.1. Die automatisierte Suite deckt die DOM-Schicht, Prompt und Parsing, die Anfrageformen der Anbieter, das Engine-Verhalten und die Options-Oberfläche ab – **95 Tests** – und `npm run verify` ergänzt eine Prüfung in 12 Punkten: Syntax, Testsuite, HTML-Sink-Verbot, Schlüssel-Leckprüfung, klassische Content-Scripts, Versionsgleichheit, CHANGELOG-Abdeckung und Paketierung.

```bash
npm install       # nur Entwicklung: jsdom für die DOM-Tests
npm test          # 95 Tests
npm run bench     # Segmentierungs-Benchmark, ohne API-Schlüssel
npm run verify    # Syntax + Tests + Richtlinienprüfungen + Paketprüfung
npm run package   # kopiert nur auslieferbare Dateien nach dist/
npm run release   # dist + release/*.zip, *.crx, *.pem zur Verteilung
```

Der Benchmark misst Segmentierung, nicht Übersetzungsqualität: Auf den vier Beispielseiten erzeugt ein unabhängiger Textknoten-Sammler **108 Fragmente**, der Block-Sammler **63 Einheiten** (1,7-mal weniger insgesamt, **2,5-mal** beim Nachrichtenartikel), und Fragmente unter 25 Zeichen sinken von **81 auf 34**. Die Übersetzungsqualität hängt weiterhin vom angeschlossenen Modell ab – die manuelle Checkliste in [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) deckt ab, was automatisierte Tests nicht erreichen (RTL-Darstellung, Tooltips, echter SPA-Verkehr, Anbieterfehler).

Die CI führt `npm run verify` und `npm run bench` unter Node 20 und 22 bei jedem Push und Pull Request aus ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Projektstruktur

```
manifest.json                 Manifest V3: Berechtigungen, Content-Scripts, Tastenkürzel
background/
  service-worker.js           Menüs, Kürzel, Nachrichtenrouting, Keep-alive
  fetch-utils.js              Fetch-Proxy zum Anbieter: URL/Header-Prüfung, Timeout, Fehlerarten
  site-prefs.js               serialisiertes Lesen-Ändern-Schreiben je Website
content/
  languages.js                22 Sprachen, Standardwerte, Anzeigenamen
  providers.js                Prompts, Stilrichtlinien, JSON-Parsing, Normalisierung, Gemini/OpenAI/Ollama
  translation-engine.js       Cache, Aufteilung, Nebenläufigkeit, Wiederholung, Bisektion, Qualitätsdurchgang
  dom-processor.js            Blockeinheiten, Token, geprüftes Anwenden, exakte Wiederherstellung, Richtung
  content-script.js           Orchestrierung, Zustand, Messaging, automatische Übersetzung
  styles.css                  die beiden Regeln, die RTL wirklich braucht
popup/                        Sprachauswahl, Übersetzen/Zurücksetzen, Fortschritt, Fehler
options/                      Anbieter, Schlüssel, Modell, Stil, Qualität, Glossar, Website-Einstellungen
icons/                        Symbole 16/48/128 px
docs/i18n/                    Übersetzungen dieses README, eine Datei je Sprache
tests/  scripts/  bench/      nur Entwicklung – von der Erweiterung nie geladen
```

## Mitmachen

Issues und Pull Requests sind willkommen. Vor dem Senden einer Änderung `npm run verify` ausführen; die Erweiterung build-frei halten, Anbieterverkehr im Service Worker lassen und niemals `innerHTML` einführen. Wer den Prompt ändert, ergänzt oder aktualisiert einen Test – Prompt, Parser und Normalisierer werden zusammen getestet, weil sie nur als Satz funktionieren.

Die vollständigen Regeln, die Übersetzungsrichtlinie für `docs/i18n/` und die Commit-Konventionen stehen in [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Lizenz

MIT — siehe [`LICENSE`](../../LICENSE). Drittanbieterdienste, die Sie verbinden (Gemini, OpenRouter, Ollama…), haben eigene Bedingungen und Preise.
