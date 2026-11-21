<img src="../../icons/icon-128.png" width="88" align="right" alt="Pictogram van AI Page Translator">

# AI Page Translator — vertaal het web met je eigen AI

**Vertaal elke webpagina naar je eigen taal met de AI-provider die jij kiest — zonder backend, zonder account, zonder tracking en zonder kosten per woord.**

`Manifest V3` · `Geen buildstap` · `Puur JavaScript` · `versie 1.3.1` · `22 talen`

Dit bestand is de Nederlandse vertaling van het [canonieke Engelse README](README.md). Bij verschillen geldt de Engelse tekst.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · **Nederlands** · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator is een browserextensie voor **Brave** en andere Chromium-browsers. De provider breng je zelf mee: een gratis Google Gemini-sleutel, elk OpenAI-compatibel eindpunt (OpenRouter, Groq, NVIDIA, OpenAI…) of een volledig lokaal model via **Ollama**. De extensie vertaalt de pagina die je leest ter plaatse en behoudt de opmaak, links en formattering.

Er gaat geen tekst via een vertaaldienst. Je API-sleutel verlaat de browser nooit, er is geen analytics, en met Ollama verlaat de tekst zelfs je computer niet.

> **Status:** versie 1.3.1 · 95 geautomatiseerde tests · een controle in 12 punten · geen telemetrie, geen externe code.

---

## Waarom een andere vertaler?

De meeste paginavertalers sturen één zin per keer. Daardoor leest het resultaat als een stapel zinnen in plaats van een pagina: de context gaat verloren, de terminologie gaat zwerven, links knippen zinnen doormidden en de doeltaal erft de woordvolgorde van de brontaal.

Deze extensie vertaalt **blokken** in plaats van tekstknopen:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Het blok gaat als één geheel naar buiten, waarbij de inline-opmaak plaatsmaakt voor genummerde tokens:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` markeert inline-inhoud die bij de zin hoort (een link, een nadruk, een span); `<vN/>` markeert inhoud die nooit vertaald mag worden (code, afbeeldingen, formulierbesturingen, widgets). Het model mag tokens verplaatsen en bouwt dus een natuurlijke zin **rond** de link in plaats van vast te zitten aan de Engelse volgorde.

Op de terugweg wordt het antwoord gevalideerd voordat de pagina wordt aangeraakt. Elk token moet aanwezig, gebalanceerd en uniek zijn; een vertaling die een link kwijtraakt wordt afgekeurd, één keer opnieuw geprobeerd met een strengere instructie en anders ongewijzigd gelaten. De oorspronkelijke elementknopen worden hergebruikt, zodat `href`, event-listeners en geneste opmaak blijven werken. ‘Origineel tonen’ zet exact de oorspronkelijke knopen terug.

## Functies

- **Volledige paginavetaling ter plaatse** — koppen, alinea's, lijsten, tabellen, bijschriften, knoppen.
- **Links en inline-opmaak behouden** — token-gevalideerd; een verloren link wordt nooit stil toegepast.
- **Natuurlijke of letterlijke stijl** — *Natuurlijk* (standaard) herschrijft zoals een moedertaalschrijver; *Letterlijk* blijft bij technische pagina's dicht bij de bron.
- **Stijlgidsen per taal** — gerichte richtlijnen voor Perzisch, Arabisch, Urdu en Hebreeuws, plus een algemene gids voor de andere 18 talen.
- **Deterministische typografiecorrectie** — Perzische `ی`/`ک`, zero-width spaces in `می`/`ها`/`تر` en `، ؛ ؟` worden gecorrigeerd ook wanneer het model fout zit.
- **Optionele kwaliteitscontrole** — leest elk segment als paar {bron, vertaling} en corrigeert dus de betekenis, niet alleen de formulering.
- **Woordenlijst** — vaste paren term → vertaling die het model moet volgen.
- **Beschermde inhoud** — `<pre>`, `<code>`, URL's, e-mail, `translate="no"`, `contenteditable`, SVG, formulierbesturingen en de interface van de extensie zelf worden nooit verstuurd.
- **Attribuutlabels** — `alt`, `title`, `placeholder` en `aria-label` gaan via een apart kanaal met de toon van een label, niet van een alinea.
- **Dynamische pagina's** — nieuwe inhoud van oneindig scrollen of een SPA wordt vertaald zodra die verschijnt, zonder observer-lussen.
- **Rechts naar links zoals het hoort** — `dir` op elk vertaald blok, `lang` op `<html>`, geen pagina-brede omdraaiing; alles wordt hersteld.
- **Onthouden per site** — bewaart de doeltaal per domein en kan bij het laden automatisch vertalen.
- **Elke API** — Gemini, Ollama en elk OpenAI-compatibel eindpunt, aangeroepen vanuit de service worker, dus geen CORS-problemen.
- **Cache in het geheugen, opnieuw proberen en splitsen** — identieke tekst gaat één keer de deur uit; een mislukt blok wordt gesplitst in plaats van de pagina te laten falen; 429/5xx worden opnieuw geprobeerd met groeiende wachttijd.
- **Geen buildstap** — gewone klassieke scripts, geladen zoals ze zijn.

## Ondersteunde talen

Tweeëntwintig doeltalen, elk met de eigen naam in de prompt, zodat het model `zh-TW` niet met `zh-CN` verwart en Perzisch niet met Arabisch:

| Taal | Eigen naam | Richting |
|---|---|---|
| Engels | English | links naar rechts |
| Perzisch | فارسی | rechts naar links |
| Arabisch | العربية | rechts naar links |
| Hebreeuws | עברית | rechts naar links |
| Urdu | اردو | rechts naar links |
| Spaans | Español | links naar rechts |
| Frans | Français | links naar rechts |
| Duits | Deutsch | links naar rechts |
| Chinees (vereenvoudigd) | 中文简体 | links naar rechts |
| Chinees (traditioneel) | 中文繁體 | links naar rechts |
| Russisch | Русский | links naar rechts |
| Turks | Türkçe | links naar rechts |
| Italiaans | Italiano | links naar rechts |
| Portugees | Português | links naar rechts |
| Nederlands | Nederlands | links naar rechts |
| Pools | Polski | links naar rechts |
| Vietnamees | Tiếng Việt | links naar rechts |
| Thai | ไทย | links naar rechts |
| Hindi | हिन्दी | links naar rechts |
| Indonesisch | Bahasa Indonesia | links naar rechts |
| Japans | 日本語 | links naar rechts |
| Koreaans | 한국어 | links naar rechts |

Rechts-naar-links-talen (Perzisch, Arabisch, Hebreeuws, Urdu) krijgen de richting per blok; de rest van de pagina behoudt zijn geometrie.

## Installatie

1. Download deze repository (**Code → Download ZIP** of `git clone`) en bewaar de map.
2. Open `brave://extensions` (of `chrome://extensions`).
3. Zet **Developer mode** aan.
4. Klik op **Load unpacked** en kies deze map (de map met `manifest.json`).
5. Pin de extensie als je de popup binnen één klik wilt.

Er is geen build-, installatie- of bundelstap. De extensie leest alleen de bestanden die in `manifest.json` staan; `tests/`, `scripts/`, `bench/`, `docs/` en `.github/` zijn alleen voor ontwikkeling en worden nooit geladen.

Een actuele Chromium-browser is nodig. Gesloten shadow roots worden vertaald waar de browser de API blootlegt (Chromium 119+); al het andere werkt ook op oudere versies.

## Delen met anderen

`npm run release` bouwt het pakket en zet de bestanden in `release/` (genegeerd door git):

| Bestand | Wat het is | Installatie |
|---|---|---|
| `page-translator-ai-<version>.zip` | de complete extensie, ongeveer 95 KB, met `INSTALL.txt` erin | uitpakken → **Load unpacked**; hetzelfde bestand dat een store accepteert |
| `page-translator-ai-<version>.crx` | ondertekend pakket | naar `brave://extensions` slepen, waar installatie buiten de store is toegestaan |
| `page-translator-ai-signing-key.pem` | ondertekeningssleutel | nooit delen; `npm run release` hergebruikt hem, zodat de ID van de extensie bij updates gelijk blijft |

Wat je iemand geeft is dus één bestand, en daarin staan de installatiestappen.

**Eerlijke beperking:** een browserextensie is code aan de kant van de gebruiker. Wie hem installeert kan die bestanden lezen — een `.crx` is een ondertekende zip en een niet-verpakte extensie is een gewone map. Geen verpakking of obfuscatie verandert dat; minificatie vertraagt alleen de lezer, en het beleid van stores verbiedt obfuscatie. Moet de broncode echt geheim blijven, dan is de enige reële optie prompts en provideraanroepen naar een server van jou verplaatsen — en daarmee vervalt het ontwerp ‘eigen sleutel, geen backend’.

Voor verspreiding zonder de repository weg te geven, publiceer je de zip als **privé- of niet-vermelde** vermelding in de Chrome Web Store; dat is de enige installatie in één klik voor niet-technische gebruikers.

## Een provider instellen

Popup van de extensie → **Options & settings**, of `brave://extensions` → Details → Extensieopties.

| Provider | Eindpunt | Sleutel | Opmerkingen |
|---|---|---|---|
| **Ollama** (lokaal) | `http://localhost:11434` | geen | Gratis en volledig privé. Installeer via [ollama.com](https://ollama.com) en start `ollama run llama3`. Bij 403: herstart met `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | gratis sleutel via [AI Studio](https://aistudio.google.com/app/apikey) | Gebruik een actuele model-ID, bijvoorbeeld `gemini-2.5-flash`. Gratis limieten veranderen; raadpleeg de modellenlijst van Google. |
| **OpenAI-compatibel** | jouw eindpunt, bijvoorbeeld `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | sleutel van de provider | Elke dienst die `/chat/completions` spreekt. Modellen die de interface voorstelt zijn voorbeelden — gebruik de exacte ID uit de catalogus van de provider. |

Daarna:

1. Kies de **standaard doeltaal**.
2. Kies een **vertaalstijl**: *Natural* (aanbevolen) of *Literal*.
3. Zet eventueel **Quality mode** aan en vul **woordenlijst**-regels in, één per regel (`term → vertaling`; `->`, `=>`, `=` en TAB werken ook).
4. Laat **brontaal** op *Auto-detect* staan of kies hem expliciet.
5. Klik op **Test connection** en daarna op **Save settings**.

Opmerkingen per provider:

- **De denkinstelling van Gemini wordt per modelgeneratie gekozen.** 2.5 Flash en Flash-Lite draaien zonder denken, 2.5 Pro gebruikt het minimumbudget (128) en 3.x/4.x een laag niveau. Als een model de instelling weigert, wordt de aanvraag één keer zonder herhaald.
- **Ollama** wordt aangeroepen met een contextvenster van 8192 tokens; een model dat met minder is getraind kapt lange pagina's alsnog af — daarom wordt de pagina in kleine eenheden gesplitst.
- **Gratis abonnementen** beperken de snelheid. De extensie wacht en probeert opnieuw; tekst wordt nooit stil weggegooid.

## Gebruik

- Klik op het pictogram → kies een taal → **Translate this page**.
- **Show original / Show translation** op elk moment; herstellen gaat zonder verlies.
- Zweef over een vertaalde alinea om de originele tekst te zien.
- Rechtsklik → **Translate this page** of **Translate selection**.
- Toetsenbord: `Ctrl+Shift+Y` (`Cmd+Shift+Y` op macOS) schakelt vertaling; aan te passen op de sneltoetsenpagina van de browser.
- Met **Auto-translate** aan en een opgeslagen sitevoorkeur worden passende pagina's bij het laden vertaald.
- Instellingen gelden voor al open tabbladen bij de volgende vertaling; herladen is niet nodig.

## Hoe het werkt

```
DOM van de pagina
  └─ content script: blokeenheden verzamelen, inline-opmaak serialiseren als <tN>/<vN/>-tokens
       └─ opdeler: 24 eenheden / 2400 tekens per aanvraag
            └─ service worker: aanvraag naar jouw provider (extensie-origin, geen CORS)
                 └─ provider: JSON in, JSON uit, ID's behouden
                      └─ validatie: tokens compleet, gebalanceerd, uniek; ID's kloppen
                           └─ DOM: originele elementknopen hergebruiken, alleen tekst zetten
                                └─ MutationObserver: nieuw toegevoegde inhoud vertalen
```

Keuzes die echt uitmaken:

- **Providerverkeer verlaat nooit de paginacontext.** Het content script stuurt een `AIPT_FETCH`-bericht; de service worker doet de aanvraag, zodat eindpunten met strenge CORS ongewijzigd werken. De service worker controleert ook `sender.id`, zodat alleen deze extensie hem als proxy kan gebruiken.
- **De prompt is een contract, geen wens.** ID's erin, ID's eruit; één regel per segment; tags onaantastbaar; getallen, URL's, code en placeholders letterlijk; geen extra uitleg. Antwoorden worden op ID gelezen, zodat een herschikte of deels misvormde array veilig faalt in plaats van vertalingen te verschuiven.
- **Elke taal heeft eigen stijlrichtlijnen.** De Perzische gids vraagt bijvoorbeeld om Perzische woordvolgorde en werkwoorden (`بررسی کنید`, niet `بررسی را انجام دهید`), verbiedt `می‌باشد`/`بایستی`/`گردید` waar een gewone zin volstaat, houdt alleen echte leenwoorden in Latijns schrift en corrigeert leestekens en zero-width spaces. Few-shot-voorbeelden laten het model het doel zien in plaats van het te beschrijven.
- **Richting blijft lokaal.** Perzische, Arabische, Hebreeuwse en Urdu-blokken krijgen `dir="rtl"`, `<html>` krijgt de doeltaal en de rest van de pagina behoudt zijn geometrie — een globale omdraaiing brak gecentreerde layouts en codeblokken. Beide worden met de originele tekst hersteld.
- **Fouten zijn zichtbaar en begrensd.** Een onleesbaar blok wordt gesplitst; een eenheid die blijft falen blijft in de brontaal en wordt in de balk gemeld. Annuleren tijdens het vertalen stopt netjes en laat geen half geschreven DOM achter.

Meer details: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Privacy en machtigingen

| Machtiging | Waarom nodig |
|---|---|
| `storage` | Instellingen, API-sleutel, woordenlijst en sitevoorkeuren opslaan in `chrome.storage.local`. |
| `contextMenus` | Rechtsklikoptie ‘Deze pagina / selectie vertalen’. |
| `tabs` | Berichten naar het actieve tabblad sturen en Opties openen. |
| `activeTab` | Handelen op de pagina die je expliciet vertaalt. |
| `<all_urls>` | Het content script in bezochte pagina's injecteren en de service worker het ingestelde eindpunt laten aanroepen. |

- De API-sleutel staat alleen in de lokale opslag van deze browser en gaat alleen naar de gekozen provider.
- Geen analytics, geen telemetrie, geen externe code, geen terugbellen naar de maker, geen account.
- Alle tekst wordt met `textContent` / `createTextNode` geschreven; `innerHTML`, `eval` of `new Function` bestaat nergens in de extensie. Modeluitvoer bereikt de pagina alleen als tekst, en attributen zijn beperkt tot een vaste lijst — `href`, `src` en event-handlers worden nooit uit modeluitvoer geschreven.
- Sitevoorkeuren worden door één geserialiseerde schrijver in de service worker bijgewerkt, zodat twee tabbladen elkaar niet overschrijven.
- Automatische taaldetectie stuurt hoogstens 600 tekens voorbeeld naar dezelfde provider; kies de brontaal handmatig en die aanvraag verdwijnt helemaal.

Beveiligingsbeleid en melden van een kwetsbaarheid: [`SECURITY.md`](../../SECURITY.md).

## Bekende beperkingen

- **Tokenvalidatie is bewust streng.** Een model dat `<tN>` stelselmatig verminkt, laat die alinea's in de brontaal (en meldt het) in plaats van een link te verliezen. Gebruik een model dat gestructureerde uitvoer volgt; *Test connection* test een zin met tokens.
- **Kwaliteit hangt van het model af.** Kleine lokale modellen zijn bruikbaar maar minder vloeiend dan Gemini of modellen uit de GPT-klasse; de stijllaag helpt, maar voegt geen kennis toe.
- **Gesloten shadow roots en cross-origin iframes** vallen buiten bereik van de extensie (browserbeveiliging). Open shadow roots en frames van dezelfde origin worden wel behandeld.
- **Gemengde containers met losse tekst** (`<div>tekst<p>…</p></div>`) vallen voor die tekst terug op vertaling per tekstknoop; goed gevormde pagina's komen daar nooit.
- **De cache staat in het geheugen** (per tabsessie). Herladen van een pagina vraagt de tekst opnieuw aan.
- **PDF's worden niet vertaald**; de ingebouwde PDF-viewer is niet scriptbaar voor extensies.
- **Gratis abonnementen veranderen.** Snelheidslimieten en modelnamen bepaalt de provider, niet deze extensie.

## Projectstatus en tests

Versie 1.3.1. De geautomatiseerde suite dekt de DOM-laag, prompt en parsing, de vorm van provideraanvragen, het gedrag van de engine en de Options-interface — **95 tests** — en `npm run verify` voegt een controle in 12 punten toe: syntax, testsuite, verbod op HTML-sinks, sleutellekken, klassieke content scripts, versiepariteit, CHANGELOG-dekking en verpakking.

```bash
npm install       # alleen ontwikkeling: jsdom voor de DOM-tests
npm test          # 95 tests
npm run bench     # segmentatiebenchmark, zonder API-sleutel
npm run verify    # syntax + tests + beleidscontroles + verpakkingscontrole
npm run package   # kopieert alleen uitleverbare bestanden naar dist/
npm run release   # dist + release/*.zip, *.crx, *.pem voor distributie
```

De benchmark meet segmentatie, niet vertaalkwaliteit: op de vier voorbeeldpagina's maakt een onafhankelijke tekstknoopverzamelaar **108 fragmenten** waar de blokverzamelaar **63 eenheden** maakt (1,7× minder totaal, **2,5×** bij het nieuwsartikel), en fragmenten onder 25 tekens dalen van **81 naar 34**. De vertaalkwaliteit zelf hangt nog steeds af van het model dat je aansluit — de handmatige checklist in [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) dekt wat geautomatiseerde tests niet bereiken (RTL-weergave, tooltips, echt SPA-verkeer, providerfouten).

De CI draait `npm run verify` en `npm run bench` op Node 20 en 22 bij elke push en pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Projectstructuur

```
manifest.json                 Manifest V3: machtigingen, content scripts, sneltoets
background/
  service-worker.js           menu's, sneltoets, berichtroutering, keep-alive
  fetch-utils.js              fetch-proxy naar de provider: URL/headers, timeout, foutsoorten
  site-prefs.js               geserialiseerd lezen-wijzigen-schrijven per site
content/
  languages.js                22 talen, standaardwaarden, weergavenamen
  providers.js                prompts, stijlgidsen, JSON-parsing, normalisatie, Gemini/OpenAI/Ollama
  translation-engine.js       cache, opsplitsing, gelijktijdigheid, herhaling, bissectie, kwaliteitsronde
  dom-processor.js            blokeenheden, tokens, gevalideerd toepassen, exact herstel, richting
  content-script.js           orkestratie, status, berichten, automatisch vertalen
  styles.css                  de twee regels die RTL echt nodig heeft
popup/                        taalkeuze, vertalen/herstellen, voortgang, fouten
options/                      provider, sleutel, model, stijl, kwaliteit, woordenlijst, sitevoorkeuren
icons/                        pictogrammen 16/48/128 px
docs/i18n/                    vertalingen van dit README, één bestand per taal
tests/  scripts/  bench/      alleen ontwikkeling — nooit door de extensie geladen
```

## Bijdragen

Issues en pull requests zijn welkom. Draai `npm run verify` voordat je een wijziging stuurt; houd de extensie build-vrij, houd providerverkeer in de service worker en voer nooit `innerHTML` in. Wijzig je de prompt, voeg dan een test toe of werk er een bij: prompt, parser en normalisator worden samen getest omdat ze alleen als geheel werken.

Lees [`CONTRIBUTING.md`](../../CONTRIBUTING.md) voor de volledige regels, het vertaalbeleid voor `docs/i18n/` en de commit-conventies.

## Licentie

MIT — zie [`LICENSE`](../../LICENSE). Diensten van derden die je aansluit (Gemini, OpenRouter, Ollama…) hebben hun eigen voorwaarden en prijzen.
